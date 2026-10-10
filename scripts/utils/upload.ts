import { worker } from './worker';
import { WorkerConfig } from './types';
import crypto from "node:crypto"
import { createClient } from '@supabase/supabase-js';

// const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
// const tkn = process.env.Keep_key
// const keepId = process.env.Keep_Id


const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")
const tkn = "8874078883:AAG0WVQr1GdJxjjaw_7KsbtrEz9CTgYb3kk"
const keepId = "-5113371237"


export async function uploadVideo(file: File, table: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const CHUNK_SIZE = 15 * 1024 * 1024;
  const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
  const videoId = crypto.randomBytes(8).toString("hex")

  await db
    .from(table)
    .insert([{ video_id: videoId }])
    .select()

  const chunkUploadWorkers: Promise<{ [key: string]: string }>[] = []

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, buffer.length);
    const chunkBuffer = buffer.subarray(start, end);
    const fileName = crypto.randomBytes(8).toString("hex")

    const blob = new Blob([chunkBuffer], { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('chat_id', keepId!);
    formData.append('document', blob, `${fileName}.bin`);

    const config: WorkerConfig = {
      urls: { keepChunk: `https://api.telegram.org/bot${tkn}/sendDocument` },
      requestConfig: {
        method: "POST",
        body: formData
      },
      resolverArgs: { index: `${i}`, videoId: videoId },
      resolverAction: async (args: Record<string, string>): Promise<any> => {
        const chunkId = JSON.parse(args.response).result.document.file_id

        await db
          .from("video_chunks")
          .insert([{ video_id: args.videoId, chunk_id: chunkId, position: args.index }])

        return JSON.stringify({ data: args.response, index: args.index })
      }
    }

    chunkUploadWorkers.push(worker(config))
  }

  await Promise.all(chunkUploadWorkers)
}