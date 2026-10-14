import path from 'path';
import fsPromises from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { retrive } from './utils/retriveVideo';
import { worker } from './utils/worker';
import { WorkerConfig } from './utils/types';
import { downloadVideo, selectKey } from './utils/helpers';


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
    resolverAction: async (args) => args.headers['x-goog-upload-url']

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
async function sendToAI({ prompt, fileUrl, key }: { prompt: string, fileUrl: string, key: string }): Promise<string | null> {
  const geminiAPi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`
  const config: WorkerConfig = {
    urls: {
      chat: geminiAPi
    },
    requestConfig: {
      headers: {
        'x-goog-api-key': `${key}`,
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

  if (chat.candidates) {
    const response: string | null = chat?.candidates[0]?.content?.parts[0]?.text || null
    return response
  } else {
    retries++
    if (retries === 3) {
      return null
    }
    return await sendToAI({ prompt: prompt, fileUrl: fileUrl, key: key })
  }
}


export async function processHookPipeline() {
  console.log('RUNNING HOOK PIPELINE');
  const hookPromptFilePath = path.resolve(__dirname, "utils", "onScreenTextPrompt.txt")
  const hookPromptFile = await fsPromises.readFile(hookPromptFilePath)
  const hookPrompt = hookPromptFile.toString()

  const videoDescriptionPromptFilePath = path.resolve(__dirname, "utils", "videoDescriptionPrompt.txt")
  const videoDescriptionPromptFile = await fsPromises.readFile(videoDescriptionPromptFilePath)
  const videoDescriptionPrompt = videoDescriptionPromptFile.toString()

  const clip: Clip = await retrive({ table: "pip_videos" })
  const tempDir = path.resolve(__dirname, 'temp');
  await fsPromises.mkdir(tempDir, { recursive: true });
  const tempFilePath = path.resolve(tempDir, `temp_input_${Date.now()}.mp4`);
  await downloadVideo(clip.url, tempFilePath)

  const hookPromptFileUpload = await uploadFile(tempFilePath)
  const descriptonFileUploadRequsets: Promise<{ key: string, file: any }>[] = []

  try {
    if (!hookPromptFileUpload.file.uri) {
      return
    }

    const onScreenTextResult = await sendToAI({
      prompt: hookPrompt,
      fileUrl: hookPromptFileUpload.file.uri,
      key: hookPromptFileUpload.key
    })

    if (!onScreenTextResult) {
      return
    }

    const hooks = onScreenTextResult.split("\n")
    const descriptionCount = 1
    hooks.map(async hook => {
      if (hook && !hook.toLowerCase().includes("titles")) {
        descriptonFileUploadRequsets.push(uploadFile(tempFilePath))
        const formatedHook = wrapText(hook)

        if (formatedHook.length && formatedHook.length < descriptionCount) {
          const hookLines = { lines: formatedHook }
          const { error } = await db.from("video_hooks")
            .insert([{
              video_id: clip.video_id,
              hook: JSON.stringify(hookLines)
            }])
          console.log(error);

        }
      }
    })

    const descriptonFileUploadResponses = await Promise.all(descriptonFileUploadRequsets)

    const descriptionGenerationRequests: Promise<string | null>[] = []

    descriptonFileUploadResponses.map(response => {
      descriptionGenerationRequests.push(sendToAI({
        prompt: videoDescriptionPrompt,
        fileUrl: response.file.uri,
        key: response.key
      }))
    })

    const descriptionGenerationResponses = await Promise.all(descriptionGenerationRequests)
    descriptionGenerationResponses.map(async description => {
      const { error } = await db.from("video_descriptions")
        .insert([{ video_id: clip.video_id, content: description }])
      console.log(error);
    })


    return onScreenTextResult;
  }
  finally {
    const fileDeleteRequests: Promise<Record<string, any>>[] = []

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

    fileDeleteRequests.push(worker(config))

    descriptonFileUploadRequsets.map(async (uploadInfo) => {
      const info = await uploadInfo
      console.log(info);

      if (!info) return
      config.urls.deleteFile = `https://generativelanguage.googleapis.com/v1beta/${info.file.name}`
      if (config.requestConfig) {
        config.requestConfig.headers = {
          'x-goog-api-key': `${hookPromptFileUpload.key}`
        }
      }
      fileDeleteRequests.push(worker(config))
    })

    await Promise.all(fileDeleteRequests)
    await fsPromises.unlink(tempFilePath)
  }

}
// processHookPipeline()