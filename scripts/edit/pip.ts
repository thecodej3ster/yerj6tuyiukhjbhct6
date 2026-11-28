import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from "path"
import { unlinkSync } from 'fs'

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}


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
    const sideMargin = 20;
    const filterString = `scale=${targetWidth - sideMargin * 2}:-1,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2+60:${backgroundColor}`;

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

export async function processPipPipeline(videoPath: string) {
  const tempDir = path.resolve("scripts", "temp")
  const outputPath = path.resolve(tempDir, `temp_output_${Date.now()}.mp4`)

  await createVerticalVideoFromRemote({
    inputPath: videoPath,
    outputPath: outputPath,
    backgroundColor: 'white',
  })
  unlinkSync(videoPath)
  return outputPath

}