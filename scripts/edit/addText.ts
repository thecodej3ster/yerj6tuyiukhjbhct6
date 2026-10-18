import { Resvg } from '@resvg/resvg-js';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs, { readFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { retrive } from '../utils/retriveVideo';
import { uploadVideo } from '../utils/upload';

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
  const hook: { lines: string[] } = JSON.parse(hookJson);

  const tspanLines = hook.lines
    .map((line, index) => {
      // Keep original text casing and layout so emojis remain untouched
      const safeText = escapeXml(line);
      const dy = index === 0 ? '0' : '1.05em';
      return `<tspan x="20" dy="${dy}">${safeText}</tspan>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="420" viewBox="0 0 1080 420" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="420" fill="none" />
  <style>
    text {
      /* Inter Display handles letters, Twemoji handles color vector emojis */
      font-family: "Inter Display", "Twemoji", -apple-system, sans-serif;
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
  video_id: string;
  url: string;
  hook: string;
}

export async function processTextPipeline(inputPath: string, id: string) {
  console.log('RUNNING TEXT PIPELINE');

  const video = await retrive({ table: 'video_hooks', autoDelete: true, id: id }) as VideoHookRecord;
  const tempDir = path.resolve("scripts", "temp");
  const outputPath = path.resolve(tempDir, `temp_output_${Date.now()}.mp4`);

  if (!video) {
    throw new Error('VIDEO HOOK NOT FOUND');
  }

  console.log('Rendering title PNG with Resvg...');
  const svgContent = await generateTitleSvg(video.hook);

  // Font paths configuration
  const fontPath = path.resolve("fonts", 'InterDisplay-ExtraBold.ttf');
  const emojiFontPath = path.resolve("fonts", 'NotoColorEmoji.ttf'); // Ensure Twemoji.ttf exists here

  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 1080 },
    font: {
      fontFiles: [fontPath, emojiFontPath],
      loadSystemFonts: false,
      defaultFontFamily: 'Inter Display',
    },
  });

  const tempPngPath = path.resolve(tempDir, `temp_png_${Date.now()}.png`);
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

    await uploadVideo({ table: 'editted_videos', storageUpload: true, file: file, id: id });
    console.log('Video generated successfully at:', outputPath);
  } finally {
    await fs.unlink(tempPngPath).catch(() => { });
    await fs.unlink(inputPath).catch(() => { });
    await fs.unlink(outputPath).catch(() => { });
  }
}