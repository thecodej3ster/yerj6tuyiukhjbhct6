import { worker } from "../worker"
import { WorkerConfig, ResolverArgs } from "../utils/types"
import { rotate } from "./helpers"
import { uploadFile } from "./upload"

let retryCount = 0
const aiKeys = JSON.parse(process.env.Ai_Key!).keys

async function sendToAI({ prompt, filePath, apiKey }: { prompt: string, filePath?: string, apiKey?: string }): Promise<{ content: string }> {

    apiKey = apiKey || aiKeys[0]
    const geminiAPi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`

    let fileUpload = filePath ? await uploadFile({ filePath: filePath, apiKey: apiKey }) : null

    try {
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
                                { text: prompt }
                            ],
                        },
                    ],
                },
                responseType: "json"
            },
            resolverAction: ({ response }: ResolverArgs) => {
                if (!response?.chat?.candidates[0]?.content?.parts[0]?.text) {
                    throw new Error("Ai Chat Failed");
                }
            }
        }

        if (filePath) {
            const fileConfig = {
                fileData: {
                    fileUri: fileUpload?.file.uri,
                    mimeType: "video/mp4",
                },
            }
            config.requestConfig?.body.contents[0].parts.push(fileConfig)
        }
        
        const { chat } = await worker(config)

        const fileDeleteConfig: WorkerConfig = {
            urls: {
                deleteFile: `https://generativelanguage.googleapis.com/v1beta/${fileUpload?.file.name}`
            },
            requestConfig: {
                headers: {
                    'x-goog-api-key': `${apiKey}`
                },
                method: "DELETE"
            }
        }

        try {
            await worker(fileDeleteConfig)
        } catch { }

        const response: string = chat.candidates[0].content.parts[0].text
        return { content: response }
    } catch (error) {
        retryCount++

        if (retryCount >= 4) {
            throw new Error("Ai Chat Failed");
        }

        apiKey = rotate(aiKeys, apiKey)
        return await sendToAI({ prompt: prompt, filePath: filePath, apiKey: apiKey })
    }


}

export { sendToAI }