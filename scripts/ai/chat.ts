import { worker } from "../utils/worker"
import { WorkerConfig } from "../utils/types"
import { rotate } from "./helpers"
import { uploadFile } from "./upload"

let aiRetries = 0
const aiKeys = JSON.parse(process.env.Ai_Key!).keys

async function sendToAI({ prompt, filePath, apiKey }: { prompt: string, filePath?: string, apiKey?: string }): Promise<{ content: string }> {
    apiKey = apiKey || aiKeys[0]

    const geminiAPi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`
    let fileUpload = { file: { uri: "", name: "" } }

    if (filePath) {
        fileUpload = await uploadFile({ filePath: filePath, apiKey: apiKey })
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
                const data = await sendToAI({ prompt: prompt, filePath: filePath, apiKey: apiKey })
                resolve(data)
            }, 5000)
        })

    }
}

export { sendToAI }