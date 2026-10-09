import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { retrive } from './utils/retriveVideo';
import { execSync } from 'child_process';
import fs from 'fs';
import path from "path"
import fsPromises, { readFile } from 'fs/promises';
// import dns from 'dns';
import { uploadVideo } from './utils/upload';
import { downloadVideo } from './utils/helpers';
// dns.setDefaultResultOrder('ipv4first');

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
  inputUrl: string;
  inputPath:string
  outputPath: string;
  targetWidth?: number;
  targetHeight?: number;
  backgroundColor?: string;
}

export function createVerticalVideoFromRemote({
  inputUrl,
  inputPath,
  outputPath,
  targetWidth = 1080,
  targetHeight = 1920,
  backgroundColor = 'white',
}: ProcessVideoOptions): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const filterString = `scale=${targetWidth}:-1,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2+50:${backgroundColor}`;

    await downloadVideo(inputUrl, inputPath)
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


export async function processPipPipeline() {
  const video = await retrive('cropped_videos')
  const tempDir = path.join(__dirname, "temp")
  const inputPath = path.join(tempDir, `temp_input_${Date.now()}.mp4`)
  const outputPath = path.join(tempDir, `temp_output_${Date.now()}.mp4`)
  try {
    await createVerticalVideoFromRemote({
      inputUrl: video.url,
      inputPath: inputPath,
      outputPath: outputPath,
      backgroundColor: 'white',
    })

    const buffer = await readFile(outputPath);
    const fileName = path.basename(outputPath);
    const file = new File([buffer], fileName, {
      type: "application/octet-stream",
      lastModified: Date.now(),
    })
    await uploadVideo(file, 'pip_videos')
  } catch (error) {
    console.error('Failed to create video:', error);
  }
  finally {
    await fsPromises.unlink(outputPath)
    await fsPromises.unlink(inputPath)
  }
}

