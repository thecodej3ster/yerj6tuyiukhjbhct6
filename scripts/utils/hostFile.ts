import { readFileSync } from 'fs'
import { worker } from '../worker';
import { WorkerConfig } from './types';
import crypto from 'crypto'
import FormData from 'form-data';

async function hostFile(path: string) {
    const detectVideoMimeType = (buffer: Buffer): { mime: string; ext: string } => {
        if (!buffer || buffer.length < 12) return { mime: 'video/quicktime', ext: 'mov' }
        const ftypType = buffer.toString('ascii', 4, 8)
        const brandSubtype = buffer.toString('ascii', 8, 12)
        if (brandSubtype === 'qt  ' || brandSubtype === 'moov') {
            return { mime: 'video/quicktime', ext: 'mov' }
        }
        if (ftypType === 'ftyp' || brandSubtype.startsWith('mp4')) {
            return { mime: 'video/mp4', ext: 'mp4' }
        }
        return { mime: 'video/quicktime', ext: 'mov' }
    }

    const file = readFileSync(path)
    const { ext } = detectVideoMimeType(file)
    const filename = crypto.randomBytes(8).toString("hex")
    const form = new FormData()
    form.append('mainFile', file, {
        filename: `${filename}.${ext}`,
        contentType: 'application/octet-stream'
    })
    form.append('fileDuration', '600000')

    const config: WorkerConfig = {
        urls: { fileUpload: "https://10minutefiles.com/upload-file" },
        requestConfig: {
            body: form,
            method: "POST",
            responseType: "document",
            headers: { ...form.getHeaders() }
        },
        direct: true
    }

    const fileUploadResponse = await worker(config) as { fileUpload: string }
    const downloadLinkSearch = fileUploadResponse.fileUpload.match(/(?<=data=).+(?=\")/)
    if (!downloadLinkSearch) {
        console.log(fileUploadResponse);
        throw new Error("unable to get url")
    }
    return downloadLinkSearch[0]
}

export { hostFile }