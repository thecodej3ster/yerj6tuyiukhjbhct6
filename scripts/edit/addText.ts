import { Resvg } from '@resvg/resvg-js';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs, { readFile } from 'fs/promises';
import path from 'path';
import twemoji from 'twemoji';
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

// Helper to fetch Twemoji SVG markup and embed it inline
async function replaceEmojisWithInlineSvg(text: string): Promise<string> {
  let processedText = text;

  // Extract emojis using twemoji's parsing mechanism or regex
  const emojiRegex = /\p{Extended_Pictographic}+/gu;
  const matches = text.match(emojiRegex);

  if (!matches) return escapeXml(text);

  // Cache fetched SVGs to avoid redundant network calls
  const svgCache = new Map<string, string>();

  for (const emoji of matches) {
    // Get the hex code point for Twemoji CDN
    const codePoint = twemoji.convert.toCodePoint(emoji);
    const cdnUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoint}.svg`;

    let svgData = svgCache.get(cdnUrl);
    if (!svgData) {
      try {
        const response = await fetch(cdnUrl);
        if (response.ok) {
          let svgText = await response.text();
          // Clean up the SVG snippet for inline insertion (remove xml declaration, adjust dimensions)
          svgText = svgText
            .replace(/<\?xml[^>]*\?>/g, '')
            .replace(/width="[^"]*"/, 'width="55"')
            .replace(/height="[^"]*"/, 'height="55"')
            .replace('<svg ', '<svg y="-8" style="display:inline; vertical-align:middle;" ');
          
          svgData = svgText;
          svgCache.set(cdnUrl, svgData);
        }
      } catch (e) {
        console.warn(`Failed to fetch emoji asset for ${emoji}:`, e);
      }
    }

    if (svgData) {
      // Replace the emoji character with its inline SVG markup
      processedText = processedText.replace(emoji, svgData);
    }
  }

  // Escape XML for the non-emoji text parts
  return escapeXml(processedText);
}

async function generateTitleSvg(hookJson: string): Promise<string> {
  const hook: { lines: string[] } = JSON.parse(hookJson);

  const processedLines = await Promise.all(
    hook.lines.map(async (line, index) => {
      // Process emojis into inline SVG markup
      const formattedLine = await replaceEmojisWithInlineSvg(line);
      const dy = index === 0 ? '0' : '1.05em';
      return `<tspan x="20" dy="${dy}">${formattedLine}</tspan>`;
    })
  );

  const tspanLines = processedLines.join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="420" viewBox="0 0 1080 420" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="1080" height="420" fill="none" />
  <style>
    text {
      font-family: "Inter Display", sans-serif;
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

  const video = (await retrive({ table: 'video_hooks', autoDelete: true, id: id })) as VideoHookRecord;
  const tempDir = path.resolve('scripts', 'temp');
  const outputPath = path.resolve(tempDir, `temp_output_${Date.now()}.mp4`);

  if (!video) {
    throw new Error('VIDEO HOOK NOT FOUND');
  }

  console.log('Rendering title PNG with Resvg...');
  const svgContent = await generateTitleSvg(video.hook);
  const fontPath = path.resolve('fonts', 'InterDisplay-ExtraBold.ttf');

  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 1080 },
    font: {
      fontFiles: [fontPath],
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
      type: 'application/octet-stream',
      lastModified: Date.now(),
    });

    await uploadVideo({ table: 'editted_videos', storageUpload: true, file: file, id: id });
    console.log('Video generated successfully at:', outputPath);
  } finally {
    await fs.unlink(tempPngPath).catch(() => {});
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}