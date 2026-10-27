import path from 'path';
import fsPromises from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { retrive } from '../utils/retriveVideo';
import { worker } from '../utils/worker';
import { WorkerConfig } from '../utils/types';
// import { processTextPipeline } from './addText';
import { processCropPipeline } from './crop'


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

interface Clip {
  url: string;
  video_id: string
}

function rotate(list: any[], currentElement: any) {
  const currentIndex = list.indexOf(currentElement)
  let nextIndex = currentIndex === list.length - 1 ? 0 : currentIndex + 1
  const nextElement = list[nextIndex]
  return nextElement
}

function wrapText(text: string, maxCharsPerLine: number = 26): string[] {

  const emojis = ['🤯', '😳', '😱', '👀']
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
const aiKeys = JSON.parse(process.env.Ai_Key!).keys
let apiKey = ""

async function uploadFile(filePath: string) {
  try {
    const fileProperties = await fsPromises.stat(filePath)
    apiKey = aiKeys[0]

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

    const { fileUpload } = await worker(uploadConfig) as { fileUpload: { file: { uri: string, name: string } } }

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

    return await new Promise<{ key: string, file: { uri: string, name: string } }>((resolve) => {
      setTimeout(async () => {
        apiKey = rotate(aiKeys, apiKey)
        const data = await uploadFile(filePath)
        resolve(data)
      }, 5000)
    })

  }
}

let aiRetries = 0
async function sendToAI({ prompt, filePath }: { prompt: string, filePath?: string }): Promise<{ content: string }> {
  const geminiAPi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`
  let fileUpload = { key: "", file: { uri: "", name: "" } }

  if (filePath) {
    fileUpload = await uploadFile(filePath)
  }


  const config: WorkerConfig = {
    urls: {
      chat: geminiAPi
    },
    requestConfig: {
      headers: {
        'x-goog-api-key': `${apiKey}`,
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
                  fileUri: fileUpload.file.uri,
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

  const fileDeleteConfig: WorkerConfig = {
    urls: {
      deleteFile: `https://generativelanguage.googleapis.com/v1beta/${fileUpload.file.name}`
    },
    requestConfig: {
      headers: {
        'x-goog-api-key': `${apiKey}`
      },
      method: "DELETE"
    }
  }

  await worker(fileDeleteConfig)

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
    return { content: response }
  } else {
    aiRetries++
    if (aiRetries === 3) {
      console.log(chat);
      throw new Error("Ai Chat Failed");
    }

    return await new Promise<{ content: string }>((resolve) => {
      setTimeout(async () => {
        apiKey = rotate(aiKeys, apiKey)
        const data = await sendToAI({ prompt: prompt, filePath: filePath })
        resolve(data)
      }, 5000)
    })

  }
}

// let hookRetry = 0
export async function processHookPipeline(tempFilePath: string, id: string) {
  console.log('RUNNING HOOK PIPELINE');
  // const hookPromptFileUpload = await uploadFile(tempFilePath)

  const hookPromptFilePath = path.resolve("scripts/edit/prompts/onScreenTextPrompt.txt")
  const hookSelectionPromptFilePath = path.resolve("scripts/edit/prompts/hookSelectionPrompt.txt")
  const videoDescriptionPromptFilePath = path.resolve("scripts/edit/prompts/videoDescriptionPrompt.txt")
  const tempDir = path.resolve("scripts", 'temp');

  let getResourcesRetries = 0
  const getResources = async () => {
    try {
      const hookPromptFile = await fsPromises.readFile(hookPromptFilePath)
      const hookPrompt = hookPromptFile.toString()
      const videoDescriptionPromptFile = await fsPromises.readFile(videoDescriptionPromptFilePath)
      const videoDescriptionPrompt = videoDescriptionPromptFile.toString()
      const hookSelectionPromptFile = await fsPromises.readFile(hookSelectionPromptFilePath)
      const hookSelectionPrompt = hookSelectionPromptFile.toString()
      await retrive({ table: "pip_videos", autoDelete: true, id: id })
      await fsPromises.mkdir(tempDir, { recursive: true });
      return { hookPrompt: hookPrompt, videoDescriptionPrompt: videoDescriptionPrompt, hookSelectionPrompt: hookSelectionPrompt }
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

  const { hookPrompt, videoDescriptionPrompt, hookSelectionPrompt } = await getResources()


  let onScreenTextRetries = 0
  const getOnscreenText = async function name() {
    // let hookFound = false

    try {
      const onScreenTextResponse = await sendToAI({
        prompt: hookPrompt,
        filePath: tempFilePath
      })

      const onScreenTextSelectResponse = await sendToAI({
        prompt: hookSelectionPrompt.replace('{{TITLES}}', onScreenTextResponse.content),
        filePath: tempFilePath
      })

      const onScreenTextSearch = onScreenTextSelectResponse.content.match(/^.+?\s[^\w.\s]{2}$/m)

      if (!onScreenTextSearch) {
        throw new Error("OnScreenText Does Not Match");
      }

      const onScreenText = onScreenTextSearch[0]

      console.log(onScreenText);

      // const { error } = await db.from("video_hooks")
      //   .insert([{
      //     video_id: id,
      //     hook: onScreenText
      //   }])

      // if (error) {
      //   console.log(error);
      //   throw error
      // }

      // const hooks = onScreenTextResult.split("\n")

      // let i = 0
      // const formatHook = async () => {
      //   const hook = hooks[i]

      //   if (hook && !hook.toLowerCase().includes("titles")) {
      //     const formatedHook = wrapText(hook)

      //     if (formatedHook.length && formatedHook.length < 5) {
      //       const hookLines = { lines: formatedHook }
      // const { error } = await db.from("video_hooks")
      //   .insert([{
      //     video_id: id,
      //     hook: JSON.stringify(hookLines)
      //   }])

      // if (error) {
      //   console.log(error);
      //   throw error
      // }
      //       hookFound = true
      //     }
      //   }

      // i++
      // if (i < hooks.length && !hookFound) {
      //   await formatHook()
      // }
      // }

      // await formatHook()

      // if (hookFound === false) {
      //   console.log(onScreenTextResponse);
      //   throw new Error("HOOK NOT FOUND");
      // }

      // return { onScreenTextResponse: onScreenText }
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

  await getOnscreenText()

  const descriptionResponse = await sendToAI({
    prompt: videoDescriptionPrompt,
    filePath: tempFilePath
  })


  const { error } = await db.from("video_descriptions")
    .insert([{ video_id: id, content: descriptionResponse.content }])

  if (error) {
    throw error
  }


  // await processTextPipeline(tempFilePath, id)
}


(async () => {
  await processCropPipeline()
})()