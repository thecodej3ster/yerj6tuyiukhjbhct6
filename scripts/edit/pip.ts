import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { retrive } from '../utils/retriveVideo';
import { execSync } from 'child_process';
import fs from 'fs';
import path from "path"
import fsPromises, { readFile } from 'fs/promises';
import { uploadVideo } from '../utils/upload';
import { downloadVideo } from '../utils/helpers';
import { processHookPipeline } from './hook';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}




// Helper to check if system ffmpeg exists
function getFfmpegExecutable(): string {
  try {
    const systemPath = execSync('which ffmpeg').toString().trim();
    if (systemPath && fs.existsSync(systemPath)) {
      console.log(`[FFmpeg] Using system binary at: ${systemPath}`);
      return systemPath;
    }
  } catch {
    if (ffmpegPath) {
      console.log(`[FFmpeg] Falling back to ffmpeg-static at: ${ffmpegPath}`);
      return ffmpegPath;
    }

  }


  throw new Error('No valid FFmpeg binary found.');
}

ffmpeg.setFfmpegPath(getFfmpegExecutable());

interface ProcessVideoOptions {
  inputPath: string
  outputPath: string;
  targetWidth?: number;
  targetHeight?: number;
  backgroundColor?: string;
}

export function createVerticalVideoFromRemote({
  inputPath,
  outputPath,
  targetWidth = 1080,
  targetHeight = 1920,
  backgroundColor = 'white',
}: ProcessVideoOptions): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const sideMargin = 20; // Space on each side in pixels

    const filterString = `scale=${targetWidth - sideMargin * 2}:-1,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2+60:${backgroundColor}`;
    // const filterString = `scale=${targetWidth}:-1,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2+100:${backgroundColor}`;

    // await downloadVideo(inputUrl, inputPath)
    ffmpeg()
      .input(inputPath)
      .videoFilters(filterString)
      .outputOptions([
        '-threads 2',          // Limit threads to match GitHub runner vCPUs
        '-preset ultrafast',   // Minimizes memory allocation & speeds up Action step
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-b:a 128k',
        '-y',
      ])
      .output(outputPath)
      .on('start', (cmd) => console.log(`[FFmpeg Started]: ${cmd}`))
      .on('progress', (p) => {
        if (p.percent) console.log(`Processing: ${Math.floor(p.percent)}%`);
      })
      .on('end', () => {
        console.log('Finished successfully!');
        resolve(outputPath);
      })
      .on('error', (err) => reject(err))
      .run();

  });
};


let retries = 0
export async function processPipPipeline(inputPath: string, video_id: string) {
  const handlePip = async () => {
    const tempDir = path.resolve("scripts", "temp")
    const outputPath = path.resolve(tempDir, `temp_output_${Date.now()}.mp4`)

    try {
      await createVerticalVideoFromRemote({
        inputPath: inputPath,
        outputPath: outputPath,
        backgroundColor: 'white',
      })

      await uploadVideo({ table: 'pip_videos', id: video_id })

      return outputPath
    } catch (error) {
      retries++
      if (retries < 3) {
        return await new Promise<any>((resolve) => {
          setTimeout(async () => {
            const result = await handlePip()
            resolve(result)
          }, 3000);
        })
      }
      console.log(error);
      throw new Error("COULD NOT SUCESSFULLY EXECUTE PIP PIPELINE");
    }
    finally {
      await fsPromises.unlink(inputPath)
    }
  }

  const outputPath = await handlePip()
  await processHookPipeline(outputPath, video_id)
}