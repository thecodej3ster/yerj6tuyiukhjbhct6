import cvModule from '@techstark/opencv-js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fsPromises from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { processPipPipeline } from './pip';
import { createClient } from '@supabase/supabase-js';
import { processTextPipeline } from './addText';

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
const execFileAsync = promisify(execFile);
const tempDir = path.resolve("scripts", "temp");
const tempFramePath = path.resolve(tempDir, `temp_frame_${Date.now()}.jpg`);

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

    // 1. Automatically check if the background is light (white) or dark (black) 
    // by sampling the top-left corner pixel intensity.
    const cornerPixel = gray.ucharAt(0, 0);
    const isLightBackground = cornerPixel > 127;

    // 2. Apply thresholding based on background type:
    // - Light background -> THRESH_BINARY_INV (turns dark objects white on a black background)
    // - Dark background  -> THRESH_BINARY     (turns bright objects white on a black background)
    const thresholdType = isLightBackground
      ? cv.THRESH_BINARY_INV | cv.THRESH_OTSU
      : cv.THRESH_BINARY | cv.THRESH_OTSU;

    cv.threshold(gray, thresh, 0, 255, thresholdType);

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
        const rect = cv.boundingRect(cnt);

        // Ignore contours that fill up nearly the entire canvas
        const isCanvasSize = rect.width >= img.width * 0.95 && rect.height >= img.height * 0.95;

        if (area > maxArea && !isCanvasSize) {
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

async function extractVideoRatio(videoPath: string) {
  console.log('Extracting frame 1 with FFmpeg...');

  await execFileAsync(ffmpegPath!, [
    '-i',
    videoPath,
    '-vframes',
    '1',
    '-q:v',
    '2',
    '-y',
    tempFramePath,
  ]);

  console.log('Running OpenCV crop detection...');

  const ratio = await detectCropBox(tempFramePath)

  if (!ratio) {
    console.log(ratio);
    throw new Error("Ratio is Missing");
  }

  return ratio
}

export async function processCropPipeline({ videoPath, ratio }: { videoPath: string, ratio: BoundingBox }) {
  console.log('RUNNING CROP PIPELINE');

  if (!ffmpegPath) throw new Error('FFmpeg binary is unavailable.');

  const tempOutputPath = path.resolve(tempDir, `cropped_output_${Date.now()}.mp4`);
  const { w, h, x, y } = ratio

  await execFileAsync(ffmpegPath, [
    '-i',
    videoPath,
    '-vf',
    `crop=${w}:${h}:${x}:${y}`,
    '-c:a',
    'copy',
    '-y',
    tempOutputPath,
  ]);
  console.log(`[OpenCV Result] Crop Box -> X:${x}, Y:${y}, W:${w}, H:${h}`);




  return tempOutputPath

  // const handleCrop = async () => {

  //   try {



  //   }
  //   catch (error) {
  //     retries++
  //     if (retries >= 4) {
  //       return await handleCrop()
  //     }
  //     console.log(error);
  //     throw new Error("COULD NOT SUCESSFULLY EXECUTE CROP PIPELINE");
  //   }
  //   finally {
  //     // Clean up all temporary files from system temp folder
  //     await fsPromises.unlink(tempFramePath).catch(() => { });
  //   }
}

export { extractVideoRatio }
// const { tempOutputPath } = await handleCrop()
// const pipPath = await processPipPipeline(tempOutputPath)
// if (hook !== null) {
//   await hook
// } else {
//   await fsPromises.unlink(pipPath).catch(() => { });
//   throw new Error("HOOK IS NOT INITIALIsED");
// }
// await processTextPipeline(pipPath)
// }