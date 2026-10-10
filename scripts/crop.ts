import cvModule from '@techstark/opencv-js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fsPromises, { readFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { uploadVideo } from './utils/upload';
import { worker } from './utils/worker';
import { WorkerConfig } from './utils/types';
import { downloadVideo } from './utils/helpers';

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
  await uploadVideo(file, 'cropped_videos')
}

/**
 * Execution Pipeline: Download -> Extract Frame 1 -> OpenCV Detect -> FFmpeg Crop -> Upload
 */
export async function processCropPipeline() {
  console.log('RUNNING CROP PIPELINE');

  if (!ffmpegPath) throw new Error('FFmpeg binary is unavailable.');

  const config: WorkerConfig = {
    urls: {
      getVideoUrl: "https://clipfarm-ghivhsr2j-jess-a587.vercel.app/api/videos/select"
    },
    requestConfig: {
      responseType: "json"
    }
  }
  const response = await worker(config)
  const video: { url: string } = response.getVideoUrl

  const timestamp = Date.now();
  const tempDir = path.join(__dirname, "temp");
  const tempVideoPath = path.join(tempDir, `temp_input_${timestamp}.mp4`);
  const tempFramePath = path.join(tempDir, `temp_frame_${timestamp}.jpg`);
  const tempOutputPath = path.join(tempDir, `cropped_output_${timestamp}.mp4`);

  try {
    console.log('Downloading Video ...');
    await downloadVideo(video.url, tempVideoPath);

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
    const { x, y, w, h } = await detectCropBox(tempFramePath);
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

    await uploadOutputFile(tempOutputPath);
  } finally {
    // Clean up all temporary files from system temp folder
    await fsPromises.unlink(tempVideoPath).catch(() => { });
    await fsPromises.unlink(tempFramePath).catch(() => { });
    await fsPromises.unlink(tempOutputPath).catch(() => { });
  }
}


processCropPipeline()