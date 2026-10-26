
import { Resvg } from '@resvg/resvg-js';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs, { readFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';
import fontkit from 'fontkit';

import { retrive } from '../utils/retriveVideo';
import { uploadVideo } from '../utils/upload';

const execFileAsync = promisify(execFile);

interface VideoHookRecord {
  video_id: string;
  url: string;
  hook: string;
}

interface TextEmoji {
  text: string;
  emoji: string | null;
}

const WIDTH = 1080;
const HEIGHT = 420;
const FONT_SIZE = 60;
const LETTER_SPACING = 2;
const LINE_HEIGHT = 1.05;
const TEXT_X = 20;
const TEXT_Y = 140;
const EMOJI_SIZE = 64;
const EMOJI_GAP = 12;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Extract trailing emoji sequences from a line.
function splitTextAndEmoji(line: string): TextEmoji {
  const emojiRegex =
    /((?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?)*)+)$/u;

  const match = line.match(emojiRegex);

  if (!match || match.index === undefined) {
    return { text: line, emoji: null };
  }

  return {
    text: line.slice(0, match.index).trimEnd(),
    emoji: match[1],
  };
}

// Convert an emoji into the Twemoji PNG filename.
function getTwemojiCodepoints(emoji: string): string {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16))
    .filter((code) => code !== 'fe0e')
    .join('-');
}

// Download the full-color Twemoji PNG.
async function fetchTwemoji(emoji: string): Promise<Buffer> {
  const codepoints = getTwemojiCodepoints(emoji);

  const url =
    `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codepoints}.png`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download emoji "${emoji}": HTTP ${response.status}. URL: ${url}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

// Measure text width using Fontkit.

function measureTextWidth(text: string, fontPath: string): number {
  if (!text) return 0;

  const loadedFont = fontkit.openSync(fontPath);

  // Handle FontCollection versus Font.
  const font =
    'unitsPerEm' in loadedFont
      ? loadedFont
      : loadedFont.fonts[0];

  if (!font) {
    throw new Error(`No usable font found at ${fontPath}`);
  }

  const scale = FONT_SIZE / font.unitsPerEm;
  let advanceWidth = 0;

  for (const char of text) {
    const glyph = font.glyphForCodePoint(char.codePointAt(0)!);
    advanceWidth += glyph.advanceWidth * scale;
  }

  const characterCount = Array.from(text).length;
  const spacing =
    Math.max(0, characterCount - 1) * LETTER_SPACING;

  return advanceWidth + spacing;
}


async function generateTitlePng(
  hookJson: string,
  outputPath: string,
): Promise<void> {
  const hook: { lines: string[] } = JSON.parse(hookJson);

  const fontPath = path.resolve(
    'fonts',
    'InterDisplay-ExtraBold.ttf',
  );

  await fs.access(fontPath);

  const lines = hook.lines.map((line) =>
    splitTextAndEmoji(line),
  );

  // Render text only. Emojis will be added as colored PNGs.
  const tspanLines = lines
    .map(({ text }, index) => {
      const safeText = escapeXml(text.toUpperCase());
      const dy = index === 0 ? '0' : `${LINE_HEIGHT}em`;

      return `<tspan x="${TEXT_X}" dy="${dy}">${safeText}</tspan>`;
    })
    .join('');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}"
     viewBox="0 0 ${WIDTH} ${HEIGHT}"
     xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="none"/>
  <style>
    text {
      font-family: "Inter Display", sans-serif;
      font-size: ${FONT_SIZE}px;
      font-weight: 300;
      fill: #000000;
      letter-spacing: ${LETTER_SPACING}px;
      text-anchor: start;
    }
  </style>
  <text x="${TEXT_X}" y="${TEXT_Y}">${tspanLines}</text>
</svg>`;

  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: WIDTH },
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: true,
      defaultFontFamily: 'Inter Display',
    },
  });

  const textBuffer = Buffer.from(resvg.render().asPng());

  const overlays: import('sharp').OverlayOptions[] = [];

  for (let index = 0; index < lines.length; index++) {
    const { text, emoji } = lines[index];

    if (!emoji) continue;

    try {
      const emojiBuffer = await fetchTwemoji(emoji);

      const emojiPng = await sharp(emojiBuffer)
        .resize(EMOJI_SIZE, EMOJI_SIZE, {
          fit: 'contain',
        })
        .png()
        .toBuffer();

      const textWidth = measureTextWidth(
        text.toUpperCase(),
        fontPath,
      );

      const left = Math.round(
        TEXT_X + textWidth + (text.length > 0 ? EMOJI_GAP : 0),
      );

      // Match the SVG's baseline and line spacing.
      const baseline =
        TEXT_Y + index * FONT_SIZE * LINE_HEIGHT;

      const top = Math.round(
        baseline - EMOJI_SIZE + 8,
      );

      if (
        left < 0 ||
        left + EMOJI_SIZE > WIDTH ||
        top < 0 ||
        top + EMOJI_SIZE > HEIGHT
      ) {
        console.warn(
          `Emoji "${emoji}" falls outside the title canvas on line ${index + 1}.`,
        );
        continue;
      }

      overlays.push({
        input: emojiPng,
        left,
        top,
      });
    } catch (error) {
      console.error(`Failed to render emoji "${emoji}" on line ${index + 1}:`, error);
      throw error
    }
  }

  // Composite full-color emoji PNGs over the transparent text image.
  await sharp(textBuffer)
    .composite(overlays)
    .png()
    .toFile(outputPath);
}

let retries = 0
export async function processTextPipeline(
  inputPath: string,
  id: string,
): Promise<void> {
  console.log('RUNNING TEXT PIPELINE');
  const tempDir = path.resolve('scripts', 'temp');
  const outputPath = path.resolve(tempDir, `temp_output_${Date.now()}.mp4`);
  const tempPngPath = path.resolve(tempDir, `temp_png_${Date.now()}.png`);
  const filterGraph =
    '[0:v]scale=1080:-1[scaled];' +
    '[scaled]pad=1080:1920:(ow-iw)/2:(oh-ih)/2:white[canvas];' +
    '[canvas][1:v]overlay=x=0:y=200[outv]';

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
  ]

  try {
    const video = await retrive({ table: 'video_hooks', id: id, }) as VideoHookRecord;
    await fs.mkdir(tempDir, { recursive: true });
    await generateTitlePng(video.hook, tempPngPath);
    await execFileAsync(ffmpegPath!, args);
    const buffer = await readFile(outputPath);
    const fileName = path.basename(outputPath);
    const file = new File(
      [new Uint8Array(buffer)],
      fileName,
      {
        type: 'application/octet-stream',
        lastModified: Date.now(),
      },
    );
    await uploadVideo({
      table: 'editted_videos',
      storageUpload: true,
      file,
      id,
    });

    console.log('Video generated successfully at:', outputPath);
  }
  catch (error) {
    retries++
    if (retries < 3) {
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          await processTextPipeline(inputPath, id)
          resolve()
        }, 3000);
      })
    }
    console.log(error);
    throw new Error("COULD NOT SUCESSFULLY EXECUTE TEXT PIPELINE");
  }
  finally {
    await fs.unlink(tempPngPath).catch(() => { });
    await fs.unlink(inputPath).catch(() => { });
    await fs.unlink(outputPath).catch(() => { });
  }
}
