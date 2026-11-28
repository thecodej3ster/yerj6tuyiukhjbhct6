import { WorkerConfig, ResolverArgs } from "../utils/types"
import { worker } from "../worker"
import { rotate } from "./helpers"
import fsPromises from 'fs/promises'
import path from "path"

let fileUploadRetries = 0
const aiKeys = JSON.parse(process.env.Ai_Key!).keys

async function uploadFile({ filePath, apiKey }: { filePath: string, apiKey?: string }) {
    apiKey = apiKey || aiKeys[0]
    const fileProperties = await fsPromises.stat(filePath)

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
        resolverAction: ({ headers }: ResolverArgs) => {
            if (headers['x-goog-upload-url']) {
                if (!URL.canParse(headers['x-goog-upload-url'])) {
                    throw new Error("File Upload Init Request Responded With Invalid Url");
                }
                return headers['x-goog-upload-url']
            } else {
                throw new Error("File Upload Init Request Failed");
            }
        }
    }


    try {
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
            direct: true,
            resolverAction: ({ response }: ResolverArgs) => {
                if (!response?.fileUpload?.file?.uri) {
                    throw new Error("File Was Not Uploaded");
                }
            }
        }

        const { fileUpload } = await worker(uploadConfig) as { fileUpload: { file: { uri: string, name: string } } }

        const uploadedFile = fileUpload.file

        if (!fileUpload.file) {
            throw new Error("File Not Uploaded")
        }

        return { file: uploadedFile }

    } catch (error) {
        fileUploadRetries++

        if (fileUploadRetries >= 4) {
            console.log("COULD NOT UPLOAD AI FILE");
            throw error
        }

        apiKey = rotate(aiKeys, apiKey)
        return await uploadFile({ filePath: filePath, apiKey: apiKey })
    }
}

export { uploadFile }