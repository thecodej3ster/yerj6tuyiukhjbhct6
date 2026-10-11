import { Resvg } from '@resvg/resvg-js';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { retrive } from './utils/retriveVideo';
import { uploadVideo } from './utils/upload';
import { readFile } from 'fs/promises';
import { downloadVideo } from './utils/helpers';




const execFileAsync = promisify(execFile);


function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}



async function generateTitleSvg(hookJson: string): Promise<string> {

  const hook: { lines: string[] } = JSON.parse(hookJson)

  const tspanLines = hook.lines
    .map((line, index) => {
      const safeText = escapeXml(line.toUpperCase());
      const dy = index === 0 ? '0' : '1.05em';
      return `<tspan x="20" dy="${dy}">${safeText}</tspan>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="420" viewBox="0 0 1080 420" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="420" fill="none" />
  <style>
    text {
      font-family: "Inter Display", -apple-system, sans-serif;
      font-size: 60px;
      font-weight: 300;
      fill: #000000;
      letter-spacing: 2px;
      text-anchor: start;
    }
  </style>
  <text x="20" y="140">${tspanLines}</text>
</svg>`;
}

interface VideoHookRecord {
  video_id: string
  url: string
  hook: string
}
export async function processTextPipeline() {
  console.log('RUNNING TEXT PIPELINE');

  const video = await retrive('video_hooks') as VideoHookRecord;
  const tempDir = path.join(__dirname, "temp")
  const outputPath = path.join(tempDir, `temp_output_${Date.now()}.mp4`)
  const inputPath = path.join(__dirname, `temp_input_${Date.now()}.mp4`);

  if (!video || !video.url) {
    throw new Error('VIDEO_URL is required');
  }

  await downloadVideo(video.url, inputPath);

  console.log('Rendering title PNG with Resvg...');
  const svgContent = await generateTitleSvg(video.hook);
  const fontPath = path.join(__dirname, '../fonts/InterDisplay-ExtraBold.ttf');

  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 1080 },
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: false,
      defaultFontFamily: 'Inter Display',
    },
  });

  const tempPngPath = path.join(__dirname, `../temp_png_${Date.now()}.png`);
  await fs.writeFile(tempPngPath, resvg.render().asPng());

  console.log('Running FFmpeg 9:16 video processing...');
  const filterGraph =
    '[0:v]scale=1080:-1[scaled];[scaled]pad=1080:1920:(ow-iw)/2:(oh-ih)/2:white[canvas];[canvas][1:v]overlay=x=0:y=200[outv]';

  const args = [
    '-i',
    inputPath,
    '-i',
    tempPngPath,
    '-filter_complex',
    filterGraph,
    '-map',
    '[outv]',
    '-map',
    '0:a?',
    '-c:a',
    'copy',
    '-y',
    outputPath,
  ];

  try {
    await execFileAsync(ffmpegPath!, args);
    const buffer = await readFile(outputPath);
    const fileName = path.basename(outputPath);

    const file = new File([new Uint8Array(buffer)], fileName, {
      type: "application/octet-stream",
      lastModified: Date.now(),
    });
    await uploadVideo(file, 'editted_videos')
    console.log('Video generated successfully at:', outputPath)
  } finally {
    await fs.unlink(tempPngPath).catch(() => { });
    await fs.unlink(inputPath).catch(() => { });
    await fs.unlink(outputPath).catch(() => { })
  }
}

processTextPipeline()