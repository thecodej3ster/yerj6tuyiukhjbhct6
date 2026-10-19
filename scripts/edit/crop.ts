import cvModule from '@techstark/opencv-js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fsPromises, { readFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { downloadVideo } from '../utils/helpers';
import { getVideo } from '../utils/getVideo';
import { processPipPipeline } from './pip';
import crypto from "crypto"

const execFileAsync = promisify(execFile);

interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Resolves and waits for the OpenCV.js WebAssembly module to fully initialize.
 */
async function getOpenCV(): Promise<any> {
  let cv = await cvModule;

  if (cv && typeof cv === 'object' && 'default' in cv) {
    cv = await (cv as any).default;
  }

  if (cv && cv.onRuntimeInitialized) {
    if (cv.Mat && typeof cv.Mat === 'function') {
      return cv;
    }

    await new Promise<void>((resolve) => {
      const existingCallback = cv.onRuntimeInitialized;
      cv.onRuntimeInitialized = () => {
        if (existingCallback) existingCallback();
        resolve();
      };
      if (cv.Mat) resolve();
    });
  }

  return cv;
}

/**
 * Native Node https.get() downloader that streams to disk.
 */


/**
 * Content Detection using OpenCV.js with safely managed WebAssembly memory pointers.
 */
async function detectCropBox(imagePath: string): Promise<BoundingBox> {
  const cv = await getOpenCV();

  const img = await loadImage(imagePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const src = cv.matFromImageData(imageData);

  const gray = new cv.Mat();
  const thresh = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, thresh, 240, 255, cv.THRESH_BINARY_INV);
    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    let maxArea = 0;
    let boundingBox: BoundingBox = { x: 0, y: 0, w: img.width, h: img.height };

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      try {
        const area = cv.contourArea(cnt);
        if (area > maxArea) {
          const rect = cv.boundingRect(cnt);
          if (rect.width > img.width * 0.4 && rect.height > img.height * 0.25) {
            maxArea = area;
            boundingBox = {
              x: rect.x,
              y: rect.y,
              w: rect.width,
              h: rect.height,
            };
          }
        }
      } finally {
        cnt.delete();
      }
    }

    return boundingBox;
  } finally {
    src.delete();
    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Uploads the final cropped MP4 video to a target Webhook or API URL using multipart/form-data.
 */
async function uploadOutputFile(
  filePath: string,
): Promise<void> {
  const buffer = await readFile(filePath);
  const fileName = path.basename(filePath);

  const file = new File([new Uint8Array(buffer)], fileName, {
    type: "application/octet-stream",
    lastModified: Date.now(),
  });
  // await uploadVideo(file, 'cropped_videos')
}

/**
 * Execution Pipeline: Download -> Extract Frame 1 -> OpenCV Detect -> FFmpeg Crop -> Upload
 */
let retries = 0
export async function processCropPipeline() {
  console.log('RUNNING CROP PIPELINE');

  if (!ffmpegPath) throw new Error('FFmpeg binary is unavailable.');

  const tempDir = path.resolve("scripts", "temp");

  let tempVideoPath = "";
  const tempFramePath = path.resolve(tempDir, `temp_frame_${Date.now()}.jpg`);
  const tempOutputPath = path.resolve(tempDir, `cropped_output_${Date.now()}.mp4`);
  const videoId = crypto.randomBytes(8).toString("hex")
  let ratio: BoundingBox | null = null

  try {

    const extractVideoRatio = async (ffmpegPath: string) => {
      const clip = await getVideo({ table: 'videos', isRandom: true })

      tempVideoPath = path.resolve(tempDir, `temp_input_${Date.now()}.mp4`)
      if (!clip || !clip.url) {
        console.log(clip)
        return
      }
      await downloadVideo(clip.url, tempVideoPath);

      console.log('Extracting frame 1 with FFmpeg...');
      await execFileAsync(ffmpegPath, [
        '-i',
        tempVideoPath,
        '-vframes',
        '1',
        '-q:v',
        '2',
        '-y',
        tempFramePath,
      ]);

      console.log('Running OpenCV crop detection...');
      ratio = await detectCropBox(tempFramePath)

      const maxHeight = 600 //470
      const minHeight = 376
      if (ratio.h > maxHeight || ratio.h < minHeight) {
        await fsPromises.unlink(tempVideoPath)
        await extractVideoRatio(ffmpegPath)
      }
    }

    await extractVideoRatio(ffmpegPath)
    if (!ratio) {
      console.log(ratio);

      throw new Error("Ratio is Missing");

    }
    const { x, y, w, h } = ratio as BoundingBox

    console.log(`[OpenCV Result] Crop Box -> X:${x}, Y:${y}, W:${w}, H:${h}`);

    console.log('Executing FFmpeg crop...');
    await execFileAsync(ffmpegPath, [
      '-i',
      tempVideoPath,
      '-vf',
      `crop=${w}:${h}:${x}:${y}`,
      '-c:a',
      'copy',
      '-y',
      tempOutputPath,
    ]);

    await processPipPipeline(tempOutputPath, videoId)

    return { videoId: videoId }
  }
  catch (error) {
    retries++
    if (retries < 3) {
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          await processCropPipeline()
          resolve()
        }, 3000);
      })
    }
    console.log(error);
    throw new Error("COULD NOT SUCESSFULLY EXECUTE CROP PIPELINE");
  }
  finally {
    // Clean up all temporary files from system temp folder
    await fsPromises.unlink(tempVideoPath).catch(() => { });
    await fsPromises.unlink(tempFramePath).catch(() => { });
  }
}