import path from 'path';
import fsPromises, { link } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { retrive } from '../utils/retriveVideo';
import { worker } from '../utils/worker';
import { WorkerConfig } from '../utils/types';
import { selectKey } from '../utils/helpers';
import { processTextPipeline } from './addText';


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

interface Clip {
  url: string;
  video_id: string
}


const geminiKeys = JSON.parse(process.env.Ai_Key!)

function wrapText(text: string, maxCharsPerLine: number = 26): string[] {
  const words = text.trim().replace('.', '').split(/\s+/)
  const resultLines: string[] = [];
  let line = ""
  words.map((word, i) => {
    const formatedWord = word + " "

    if (line.length + formatedWord.length > maxCharsPerLine) {
      resultLines.push(line)
      line = formatedWord
      if (i === words.length - 1) {
        resultLines.push(line)
      }
      return
    }
    if (i === words.length - 1) {
      line += formatedWord
      resultLines.push(line)
      return
    }
    line += formatedWord
  })
  return resultLines;
}

async function uploadFile(filePath: string) {
  const fileProperties = await fsPromises.stat(filePath)
  const apiKey = selectKey(geminiKeys)
  const config: WorkerConfig = {
    urls: {
      uploadUrl: `https://generativelanguage.googleapis.com/upload/v1beta/files`
    },
    requestConfig: {
      headers: {
        'x-goog-api-key': `${apiKey}`,
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': fileProperties.size.toString(),
        'X-Goog-Upload-Header-Content-Type': 'video/mp4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          displayName: path.basename(filePath)
        }
      }),
      method: "POST",

    },
    resolverAction: async (args) => {
      if (args.headers['x-goog-upload-url']) {
        return args.headers['x-goog-upload-url']
      } else {
        return args.response
      }
    },
    direct: true
  }

  const { uploadUrl } = await worker(config)

  const fileStream = await fsPromises.readFile(filePath)

  config.urls = {
    fileUpload: uploadUrl
  }

  config.resolverAction = undefined

  if (config.requestConfig) {
    config.requestConfig.headers = {
      'Content-Length': fileProperties.size.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    }
    config.requestConfig.responseType = "json"
    config.requestConfig.body = fileStream
  }

  const { fileUpload } = await worker(config)
  const uploadedFile = fileUpload.file
  return { key: apiKey, file: uploadedFile }
}

let retries = 0
async function sendToAI({ prompt, fileUrl, key }: { prompt: string, fileUrl: string, key?: string }): Promise<{ content: string, key: string } | null> {
  const geminiAPi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`
  const selectedKey = key || selectKey(geminiKeys)

  const config: WorkerConfig = {
    urls: {
      chat: geminiAPi
    },
    requestConfig: {
      headers: {
        'x-goog-api-key': `${selectedKey}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                fileData: {
                  fileUri: fileUrl,
                  mimeType: "video/mp4",
                },
              },
            ],
          },
        ],
      },
      responseType: "json"
    }
  }

  const { chat } = await worker(config)

  if (
    chat.candidates &&
    chat.candidates.length &&
    chat.candidates[0] &&
    chat.candidates[0].content &&
    chat.candidates[0].content.parts &&
    chat.candidates[0].content.parts.length &&
    chat.candidates[0].content.parts[0].textdescription
  ) {
    const response: string = chat.candidates[0].content.parts[0].text
    return { content: response, key: selectedKey }
  } else {
    retries++
    if (retries === 3) {
      return chat
    }

    return await new Promise<{ content: string, key: string } | null>((resolve) => {
      setTimeout(async () => {
        const data = await sendToAI({ prompt: prompt, fileUrl: fileUrl })
        resolve(data)
      }, 5000)
    })

  }
}


export async function processHookPipeline(tempFilePath: string, id: string) {
  console.log('RUNNING HOOK PIPELINE');

  const hookPromptFilePath = path.resolve("scripts/edit/prompts/onScreenTextPrompt.txt")
  const hookPromptFile = await fsPromises.readFile(hookPromptFilePath)
  const hookPrompt = hookPromptFile.toString()

  const videoDescriptionPromptFilePath = path.resolve("scripts/edit/prompts/videoDescriptionPrompt.txt")
  const videoDescriptionPromptFile = await fsPromises.readFile(videoDescriptionPromptFilePath)
  const videoDescriptionPrompt = videoDescriptionPromptFile.toString()

  const clip = await retrive({ table: "pip_videos", autoDelete: true, id: id })
  const tempDir = path.resolve("scripts", 'temp');
  await fsPromises.mkdir(tempDir, { recursive: true });
  const hookPromptFileUpload = await uploadFile(tempFilePath)

  if (!hookPromptFileUpload.file.uri) {
    console.log(hookPromptFileUpload);
    throw new Error(`Could Not Find Ai FileUpload Url`)
  }


  const onScreenTextResponse = await sendToAI({
    prompt: hookPrompt,
    fileUrl: hookPromptFileUpload.file.uri
  })

  if (!onScreenTextResponse) {
    console.log(onScreenTextResponse);
    throw new Error("Could Not Generate Hook")
  }

  const descriptionResponse = await sendToAI({
    prompt: videoDescriptionPrompt,
    fileUrl: hookPromptFileUpload.file.uri,
    key: onScreenTextResponse.key
  })

  if (!descriptionResponse) {
    console.log(descriptionResponse);
    throw new Error("Could Not Generate Description")
  }
  const onScreenTextResult = onScreenTextResponse.content
  const hooks = onScreenTextResult.split("\n")

  let hookFound = false
  hooks.map(async hook => {
    if (hookFound) {
      return
    }
    if (hook && !hook.toLowerCase().includes("titles")) {
      const formatedHook = wrapText(hook)

      if (formatedHook.length && formatedHook.length < 5) {
        const hookLines = { lines: formatedHook }
        const { error } = await db.from("video_hooks")
          .insert([{
            video_id: id,
            hook: JSON.stringify(hookLines)
          }])

        if (error) {
          throw error
        }

        hookFound = true
      }
    }
  })

  const { error } = await db.from("video_descriptions")
    .insert([{ video_id: id, content: descriptionResponse.content }])

  if (error) {
    throw error
  }


  const config: WorkerConfig = {
    urls: {
      deleteFile: `https://generativelanguage.googleapis.com/v1beta/${hookPromptFileUpload.file.name}`
    },
    requestConfig: {
      headers: {
        'x-goog-api-key': `${hookPromptFileUpload.key}`
      },
      method: "DELETE"
    }
  }

  await worker(config)
  await processTextPipeline(tempFilePath, id)
}

