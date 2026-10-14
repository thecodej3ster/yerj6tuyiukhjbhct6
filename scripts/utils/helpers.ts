import fs from 'fs';
import { worker } from './worker';
import { WorkerConfig } from './types';
import { GoogleGenAI } from '@google/genai';
import { pipeline } from 'stream/promises';
import path from 'path';
export async function downloadVideo(targetUrl: string, outputPath: string,): Promise<void> {

  // const formatedPath = path.resolve('../scripts/temp', path.basename(outputPath))

  const stream = fs.createWriteStream(outputPath)  

  const config: WorkerConfig = {
    urls: {
      videoDownload: targetUrl
    },
    requestConfig: {
      responseType: "stream"
    },
    resolverAction: async (args) => {
      await pipeline(args.response, stream)
    }
  }

  await worker(config)
}



interface StorageCleanupSummary {
  totalFound: number;
  deleted: number;
  failed: number;
}

export async function emptyGeminiStorage(): Promise<StorageCleanupSummary> {
  const apiKey = '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required.');
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log('Fetching file list from Gemini storage...');

  // 1. ai.files.list() returns a Pager object.
  // Iterate directly over the pager using `for await...of`.
  const pager = await ai.files.list({ config: { pageSize: 100 } });

  const fileNames: string[] = [];

  for await (const file of pager) {
    if (file.name) {
      fileNames.push(file.name);
    }
  }

  if (fileNames.length === 0) {
    console.log('Gemini storage is already empty.');
    return { totalFound: 0, deleted: 0, failed: 0 };
  }

  console.log(`Found ${fileNames.length} file(s). Deleting...`);

  // 2. Delete all files concurrently
  const deleteResults = await Promise.allSettled(
    fileNames.map(async (name) => {
      await ai.files.delete({ name });
      console.log(`Deleted: ${name}`);
    })
  );

  const deletedCount = deleteResults.filter(
    (res) => res.status === 'fulfilled'
  ).length;
  const failedCount = deleteResults.filter(
    (res) => res.status === 'rejected'
  ).length;

  console.log(
    `\nCleanup complete: ${deletedCount} deleted, ${failedCount} failed.`
  );

  return {
    totalFound: fileNames.length,
    deleted: deletedCount,
    failed: failedCount,
  };
}

let lastUsed = -1
export function selectKey(list: { keys: string[] }) {
  lastUsed++
  if (lastUsed > list.keys.length - 1) {
    lastUsed = 0
  }
  return list.keys[lastUsed]
}