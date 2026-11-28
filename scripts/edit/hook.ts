import path from 'path';
import { readFileSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { sendToAI } from '../ai/chat';

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

function wrapText(text: string, maxCharsPerLine: number = 26): string {
  const words = text.trim().replace('.', '').split(/\s+/)
  const resultLines: string[] = [];
  let line = ""

  words.map((word, i) => {
    const formatedWord = word + " "

    if (line.length + formatedWord.length > maxCharsPerLine) {
      resultLines.push(line.trim())
      line = formatedWord
      if (i === words.length - 1) {
        resultLines.push(line.trim())
      }
      return
    }
    if (i === words.length - 1) {
      line += formatedWord
      resultLines.push(line.trim())
      return
    }
    line += formatedWord
  })

  return JSON.stringify({ lines: resultLines });
}



export async function processHookPipeline({ videoPath, code }: { videoPath: string, code: string }) {
  console.log('RUNNING HOOK PIPELINE');

  const hookPromptFilePath = path.resolve("scripts/ai/prompts/onScreenTextPrompt.txt")
  const hookSelectionPromptFilePath = path.resolve("scripts/ai/prompts/hookSelectionPrompt.txt")
  const videoDescriptionPromptFilePath = path.resolve("scripts/ai/prompts/videoDescriptionPrompt.txt")
  const tempDir = path.resolve("scripts", 'temp');

  const hookPromptFile = readFileSync(hookPromptFilePath)
  const hookPrompt = hookPromptFile.toString()
  const videoDescriptionPromptFile = readFileSync(videoDescriptionPromptFilePath)
  const videoDescriptionPrompt = videoDescriptionPromptFile.toString()
  const hookSelectionPromptFile = readFileSync(hookSelectionPromptFilePath)
  const hookSelectionPrompt = hookSelectionPromptFile.toString()
  mkdirSync(tempDir, { recursive: true })

  let retries = 0
  const getOnscreenText = async function name() {
    const onScreenTextResponse = await sendToAI({
      prompt: hookPrompt,
      filePath: videoPath
    })

    const onScreenTextSelectResponse = await sendToAI({
      prompt: hookSelectionPrompt.replace('{{TITLES}}', onScreenTextResponse.content),
      filePath: videoPath
    })

    const onScreenTextSearch = onScreenTextSelectResponse.content.match(/^.+?\s[^\w.\s]{2,}$/m)

    if (!onScreenTextSearch) {
      retries++
      if (retries >= 4) {
        throw new Error("OnScreenText Does Not Match");
      }
      await getOnscreenText()
    } else {
      retries = 0

      const onScreenText = wrapText(onScreenTextSearch[0])
      console.log(onScreenText);

      const { error } = await db.from("video_hooks")
        .insert([{
          video_id: code,
          hook: onScreenText
        }])

      if (error) {
        console.log(error);
        throw error
      }
    }

  }

  await getOnscreenText()

  const getDescription = async () => {
    const descriptionResponse = await sendToAI({
      prompt: videoDescriptionPrompt,
      filePath: videoPath
    })

    const { error } = await db.from("video_descriptions")
      .insert([{ video_id: code, content: descriptionResponse.content }])

    if (error) {
      console.log(error);
      throw error
    }
  }

  await getDescription()
}