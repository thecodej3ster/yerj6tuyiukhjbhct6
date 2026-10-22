import path from 'path';
import fsPromises from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { retrive } from '../utils/retriveVideo';
import { worker } from '../utils/worker';
import { WorkerConfig } from '../utils/types';
import { processTextPipeline } from './addText';


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

interface Clip {
  url: string;
  video_id: string
}


// const geminiKeys = JSON.parse(process.env.Ai_Key!)

// console.log(geminiKeys);


// let lastUsed = -1
// function selectKey(list: { keys: string[] }) {
//   lastUsed++
//   if (lastUsed > list.keys.length - 1) {
//     lastUsed = 0
//   }
//   return list.keys[lastUsed]
// }

function wrapText(text: string, maxCharsPerLine: number = 26): string[] {
  const emojis = ['🤯', '😱', '😮', '👀']
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  const words = text.trim().replace('.', '').split(/\s+/)
  const resultLines: string[] = [];
  let line = ""

  words.map((word, i) => {
    const formatedWord = word + " "

    if (line.length + formatedWord.length > maxCharsPerLine) {
      resultLines.push(line)
      line = formatedWord
      if (i === words.length - 1) {
        resultLines.push(line + " " + emoji)
      }
      return
    }
    if (i === words.length - 1) {
      line += formatedWord
      resultLines.push(line + " " + emoji)
      return
    }
    line += formatedWord
  })
  return resultLines;
}

let fileUploadRetries = 0
async function uploadFile(filePath: string) {
  try {
    const fileProperties = await fsPromises.stat(filePath)
    const apiKey = process.env.Ai_Key!
    console.log(apiKey);

    const intiUploadConfig: WorkerConfig = {
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
      }
    }

    const { uploadUrl } = await worker(intiUploadConfig)

    console.log(uploadUrl);

    const fileStream = await fsPromises.readFile(filePath)

    const uploadConfig: WorkerConfig = {
      urls: {
        fileUpload: uploadUrl
      },
      requestConfig: {
        headers: {
          'Content-Length': fileProperties.size.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: fileStream,
        responseType: "json",
        method: "POST"
      },
      direct: true
    }

    // config.urls = {
    //   fileUpload: uploadUrl
    // }

    // config.resolverAction = undefined

    // if (config.requestConfig) {
    //   config.requestConfig.headers = {
    //     'Content-Length': fileProperties.size.toString(),
    //     'X-Goog-Upload-Offset': '0',
    //     'X-Goog-Upload-Command': 'upload, finalize',
    //   }
    //   config.requestConfig.responseType = "json"
    //   config.requestConfig.body = fileStream
    // }

    const { fileUpload } = await worker(uploadConfig)
    console.log(fileUpload);

    const uploadedFile = fileUpload.file
    if (!fileUpload.file) {
      throw new Error("File Not Uploaded")
    }
    return { key: apiKey, file: uploadedFile }
  } catch (error) {
    fileUploadRetries++
    if (fileUploadRetries === 3) {
      console.log("COULD NOT UPLOAD AI FILE");
      throw error
    }

    return await new Promise<any>((resolve) => {
      setTimeout(async () => {
        const data = await uploadFile(filePath)
        resolve(data)
      }, 5000)
    })

  }
}

let aiRetries = 0
async function sendToAI({ prompt, fileUrl, key }: { prompt: string, fileUrl: string, key?: string }): Promise<{ content: string, key: string }> {
  const geminiAPi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`
  const selectedKey = key || process.env.Ai_Key!


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
    chat.candidates[0].content.parts[0].text
  ) {
    const response: string = chat.candidates[0].content.parts[0].text
    return { content: response, key: selectedKey }
  } else {
    aiRetries++
    if (aiRetries === 3) {
      console.log(chat);
      throw new Error("Ai Chat Failed");
    }

    return await new Promise<{ content: string, key: string }>((resolve) => {
      setTimeout(async () => {
        const data = await sendToAI({ prompt: prompt, fileUrl: fileUrl, key: key })
        resolve(data)
      }, 5000)
    })

  }
}

let hookRetry = 0
export async function processHookPipeline(tempFilePath: string, id: string) {
  console.log('RUNNING HOOK PIPELINE');
  const hookPromptFileUpload = await uploadFile(tempFilePath)

  const hookPromptFilePath = path.resolve("scripts/edit/prompts/onScreenTextPrompt.txt")
  const videoDescriptionPromptFilePath = path.resolve("scripts/edit/prompts/videoDescriptionPrompt.txt")
  const tempDir = path.resolve("scripts", 'temp');

  let getResourcesRetries = 0
  const getResources = async () => {
    try {
      const hookPromptFile = await fsPromises.readFile(hookPromptFilePath)
      const hookPrompt = hookPromptFile.toString()
      const videoDescriptionPromptFile = await fsPromises.readFile(videoDescriptionPromptFilePath)
      const videoDescriptionPrompt = videoDescriptionPromptFile.toString()
      await retrive({ table: "pip_videos", autoDelete: true, id: id })
      await fsPromises.mkdir(tempDir, { recursive: true });
      return { hookPrompt: hookPrompt, videoDescriptionPrompt: videoDescriptionPrompt }
    } catch (error) {
      getResourcesRetries++
      if (getResourcesRetries === 3) {
        throw error
      }

      return await new Promise<any>((resolve) => {
        setTimeout(async () => {
          const data = await getResources()
          resolve(data)
        }, 5000)
      })
    }
  }

  const { hookPrompt, videoDescriptionPrompt } = await getResources()


  let onScreenTextRetries = 0
  const getOnscreenText = async function name() {
    let hookFound = false

    try {
      const onScreenTextResponse = await sendToAI({
        prompt: hookPrompt,
        key: hookPromptFileUpload.key,
        fileUrl: hookPromptFileUpload.file.uri
      })

      const onScreenTextResult = onScreenTextResponse.content
      const hooks = onScreenTextResult.split("\n")

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

      if (hookFound === false) {
        throw new Error("HOOK NOT FOUND");
      }

      return { onScreenTextResponse: onScreenTextResponse }
    } catch (error) {
      onScreenTextRetries++
      if (onScreenTextRetries === 3) {
        throw error
      }

      return await new Promise<any>((resolve) => {
        setTimeout(async () => {
          const data = await getOnscreenText()
          resolve(data)
        }, 5000)
      })
    }
  }

  const { onScreenTextResponse } = await getOnscreenText()

  const descriptionResponse = await sendToAI({
    prompt: videoDescriptionPrompt,
    fileUrl: hookPromptFileUpload.file.uri,
    key: onScreenTextResponse?.key
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


