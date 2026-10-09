import { PostgrestError, createClient } from '@supabase/supabase-js'
import { worker } from './worker';
import crypto from "node:crypto"
import { WorkerConfig } from './types';
import FormData from 'form-data';

const tkn = "8874078883:AAG0WVQr1GdJxjjaw_7KsbtrEz9CTgYb3kk"
const keepId = "-5113371237"
const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")


async function getSingleRowFromTable(table: string) {
  const getRandomIndex = (max: number) => {
    if (max <= 0) return 0;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  const { count, error: countError } = await db
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (countError || !count) {
    console.error('Error:', countError || `NO ${table.toUpperCase()} FOUND`);
    return null;
  }

  const randomIndex = getRandomIndex(count);
  const { data, error: videoInfoError } = await db
    .from(table)
    .select('*')
    .order("updated_at", { ascending: false })
    .range(randomIndex, randomIndex)
    .limit(1)
    .maybeSingle()


  const videoInfo = data as { video_id: string } & Record<string, any>

  if (videoInfoError || !videoInfo) {
    console.error('Error:', videoInfoError || "NO EDITTED VIDEO FOUND");
    return null;
  }

  return videoInfo;
}


export async function retrive(table: string, autoDelete = false) {
  const row = await getSingleRowFromTable(table)

  if (!row) {
    throw new Error(`No  ${table} Found`)
  }

  interface VideoChunk {
    chunk_id: string;
    video_id: string;
    position: number;
  }

  const { data: videoChunks, error } = await db
    .from("video_chunks")
    .select("*")
    .eq("video_id", row.video_id)
    .order("position", { ascending: true })

  const chunks = videoChunks as VideoChunk[] | null;

  if (!chunks) {
    throw new Error(`Unable To Find Video Chunk`)
  }

  const getFilePathWorkers: Promise<Record<string, Record<string, string>>>[] = []

  chunks.map(chunk => {
    const id = crypto.randomBytes(4).toString("hex")
    const config: WorkerConfig = { urls: {}, resolverArgs: {}, requestConfig: { responseType: "json" } }
    config.urls[id] = `https://api.telegram.org/bot${tkn}/getFile?file_id=${chunk.chunk_id}`
    if (config.resolverArgs) {
      config.resolverArgs.position = `${chunk.position}`
    }
    config.resolverAction = async (args): Promise<Record<string, string>> => {
      const data = args.response
      return { data: data.result.file_path, position: args.position }
    }
    getFilePathWorkers.push(worker(config))
  })


  const getFilePathWorkersResponse = await Promise.all(getFilePathWorkers)

  const getFileWorkers: Promise<Record<string, Record<string, ArrayBuffer | string>>>[] = []

  getFilePathWorkersResponse.map(async data => {
    const response = Object.values(data)[0]
    const id = crypto.randomBytes(4).toString("hex")

    const config: WorkerConfig = {
      urls: {},
      resolverArgs: {},
      requestConfig: { responseType: "arraybuffer" }
    }

    config.urls[id] = `https://api.telegram.org/file/bot${tkn}/${response.data}`
    if (config.resolverArgs) {
      config.resolverArgs.position = `${response.position}`
    }
    config.resolverAction = async (args): Promise<Record<string, ArrayBuffer | string>> => {
      return { data: args.response, position: args.position }
    }
    getFileWorkers.push(worker(config))
  })

  const getFileWorkersResponse = await Promise.all(getFileWorkers)

  const chunkArrange: Buffer[] = []


  getFileWorkersResponse.map(data => {
    const response = Object.values(data)[0]
    if (response.data instanceof Buffer) {
      chunkArrange[Number(response.position)] = response.data
    }
  })

  const filteredChunkArray = chunkArrange.filter(chunk => {
    if (chunk) {
      return chunk
    }
  })

  const completeVideoBuffer = Buffer.concat(filteredChunkArray)

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


  const { ext } = detectVideoMimeType(completeVideoBuffer)
  const filename = crypto.randomBytes(8).toString("hex")
  const form = new FormData()
  form.append('mainFile', completeVideoBuffer, {
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
    }
  }

  const fileUploadResponse = await worker(config)
  const downloadLinkSearch = fileUploadResponse.fileUpload.match(/(?<=data=).+(?=\")/)
  if (!downloadLinkSearch) {
    console.log(fileUploadResponse);
    
    throw new Error("unable to get url")
  }


  if (autoDelete) {
    const { error } = await db.from(table)
      .delete()
      .eq("video_id", row.video_id)
      .select()

    console.log(error);


  }


  await db.from(table)
    .update({ updated_at: new Date().toISOString() })
    .eq('video_id', row.video_id);

  return { ...row, url: downloadLinkSearch[0] } as { url: string, video_id: string, hook?: string }
}