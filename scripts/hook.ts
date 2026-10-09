import path from 'path';
import fsPromises from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { retrive } from './utils/retriveVideo';
import { worker } from './utils/worker';
import { WorkerConfig } from './utils/types';
import { downloadVideo, selectKey } from './utils/helpers';


const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

interface Clip {
  url: string;
  video_id: string
}


// const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6KcqtK8f5pZaJjb2h3d7yJu5BDvLUXRxYN0tRGJ2oFzzQ';


const geminiKeys = {
  keys: [
    "AQ.Ab8RN6JBLXkIdNG5UNEUZzFjD9ywYZ6bvOLxRqJoDZPaexS8zQ",
    'AQ.Ab8RN6KcqtK8f5pZaJjb2h3d7yJu5BDvLUXRxYN0tRGJ2oFzzQ',
    'AQ.Ab8RN6JqYnGOApdqW1U4Jv-oZE07d0HvHd6qqFvBm6cH1oSSCQ',
    'AQ.Ab8RN6IXQmX7D_6KtqDsT2vw2M4yZ_3DaO9U-IR9pBMAU3E5ag',
    'AQ.Ab8RN6JY2R5mnOCYIUaspfbRtY235up0jtuLNtsdCVnL6pw_Wg'
  ]
}



function wrapText(text: string, maxCharsPerLine: number = 24): string[] {
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
  const hookPromptFile = await fsPromises.readFile("./utils/onScreenTextPrompt.txt")
  const hookPrompt = hookPromptFile.toString()

  const videoDescriptionPromptFile = await fsPromises.readFile("./utils/videoDescriptionPrompt.txt")
  const videoDescriptionPrompt = videoDescriptionPromptFile.toString()

  const clip: Clip = await retrive("pip_videos")
  const tempDir = path.join(__dirname, 'temp');
  await fsPromises.mkdir(tempDir, { recursive: true });
  const tempFilePath = path.join(tempDir, `temp_input_${Date.now()}.mp4`);
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

    hooks.map(async hook => {
      if (hook && !hook.toLowerCase().includes("titles")) {
        descriptonFileUploadRequsets.push(uploadFile(tempFilePath))
        const formatedHook = wrapText(hook)

        if (formatedHook.length && formatedHook.length < 5) {
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

// wrapText("The moment a difficult question instantly turned into a brilliant lesson.")
// wrapText("He challenged him to a fight, but got a brilliant response.")