import path from 'path';
import fsPromises from 'fs/promises';
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



export async function processHookPipeline(tempFilePath: string, id: string) {
  console.log('RUNNING HOOK PIPELINE');
  const hookPromptFilePath = path.resolve("scripts/ai/prompts/onScreenTextPrompt.txt")
  const hookSelectionPromptFilePath = path.resolve("scripts/ai/prompts/hookSelectionPrompt.txt")
  const videoDescriptionPromptFilePath = path.resolve("scripts/ai/prompts/videoDescriptionPrompt.txt")
  const tempDir = path.resolve("scripts", 'temp');

  let getResourcesRetries = 0
  const getResources = async () => {
    try {
      const hookPromptFile = await fsPromises.readFile(hookPromptFilePath)
      const hookPrompt = hookPromptFile.toString()
      const videoDescriptionPromptFile = await fsPromises.readFile(videoDescriptionPromptFilePath)
      const videoDescriptionPrompt = videoDescriptionPromptFile.toString()
      const hookSelectionPromptFile = await fsPromises.readFile(hookSelectionPromptFilePath)
      const hookSelectionPrompt = hookSelectionPromptFile.toString()
      await fsPromises.mkdir(tempDir, { recursive: true });
      return { hookPrompt: hookPrompt, videoDescriptionPrompt: videoDescriptionPrompt, hookSelectionPrompt: hookSelectionPrompt }
    } catch (error) {
      getResourcesRetries++
      if (getResourcesRetries === 3) {
        throw error
      }

      return await new Promise<any>((resolve) => {
        setTimeout(async () => {
          const data = await getResources()
          resolve(data)
        }, 5000)
      })
    }
  }

  const { hookPrompt, videoDescriptionPrompt, hookSelectionPrompt } = await getResources()


  let onScreenTextRetries = 0
  const getOnscreenText = async function name() {
    try {
      const onScreenTextResponse = await sendToAI({
        prompt: hookPrompt,
        filePath: tempFilePath
      })

      const onScreenTextSelectResponse = await sendToAI({
        prompt: hookSelectionPrompt.replace('{{TITLES}}', onScreenTextResponse.content),
        filePath: tempFilePath
      })

      const onScreenTextSearch = onScreenTextSelectResponse.content.match(/^.+?\s[^\w.\s]{2,}$/m)

      if (!onScreenTextSearch) {
        throw new Error("OnScreenText Does Not Match");
      }

      const onScreenText = wrapText(onScreenTextSearch[0])
      console.log(onScreenText);

      const { error } = await db.from("video_hooks")
        .insert([{
          video_id: id,
          hook: onScreenText
        }])

      if (error) {
        console.log(error);
        throw error
      }

    } catch (error) {
      onScreenTextRetries++
      if (onScreenTextRetries === 3) {
        throw error
      }

      return await new Promise<any>((resolve) => {
        setTimeout(async () => {
          const data = await getOnscreenText()
          resolve(data)
        }, 5000)
      })
    }
  }

  await getOnscreenText()

  const descriptionResponse = await sendToAI({
    prompt: videoDescriptionPrompt,
    filePath: tempFilePath
  })

  const { error } = await db.from("video_descriptions")
    .insert([{ video_id: id, content: descriptionResponse.content }])

  if (error) {
    throw error
  }
  await fsPromises.unlink(tempFilePath).catch(() => { });

}