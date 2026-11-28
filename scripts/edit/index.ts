import { processCropPipeline } from "./crop"
import { processPipPipeline } from "./pip"
import { processHookPipeline } from "./hook"
import { processTextPipeline } from "./addText"
import { getVideo } from "../utils/getVideo"
import { downloadVideo } from "../utils/helpers"
import { extractVideoRatio } from "./crop"
import { createClient } from '@supabase/supabase-js';
import { hostFile } from "../utils/hostFile"

let retries = 0
async function selectVideo() {
    try {
        const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
        const video = await getVideo({ table: 'videos' })

        if (!video) {
            throw new Error("Video Was Not Found");
        }

        const inputVideoPath = `video_input_${Date.now()}.mp4`

        await downloadVideo({ url: video.url, outputPath: inputVideoPath })

        const ratio = await extractVideoRatio(inputVideoPath)
        const maxHeight = 600
        const minHeight = 376

        if (ratio.h > maxHeight || ratio.h < minHeight) {
            const { error } = await db.from('videos')
                .delete()
                .eq('code', video.code)

            if (error) {
                console.log(error);
            }

            throw new Error("Invalid Ratio");
        }
        retries = 0
        return { inputVideoPath: inputVideoPath, ratio: ratio, code: video.code }
    } catch (error) {
        retries++
        if (retries >= 4) {
            throw new Error("Could Not Select Video");
        }
        return await selectVideo()
    }
}


async function processVideoEditPipeline() {
    const jobsQueue: Promise<any>[] = []
    const { inputVideoPath, ratio, code } = await selectVideo()
    let pipVideo = ""

    jobsQueue.push(processHookPipeline({ videoPath: inputVideoPath, code: code }))

    jobsQueue.push(new Promise<void>(async (resolve, reject) => {
        try {
            const croppedVideo = await processCropPipeline({ videoPath: inputVideoPath, ratio: ratio })
            pipVideo = await processPipPipeline(croppedVideo)
            resolve()
        } catch (error) {
            reject(error)
        }
    }))

    await Promise.all(jobsQueue)

    const edittedVideo = await processTextPipeline({ videoPath: pipVideo, code: code })

    const videoUrl = await hostFile(edittedVideo)
    console.log(videoUrl);
    console.log('VIDEO EDIT PIPELINE SUCESSFULY EXECUTED');
    return { videoUrl: videoUrl, code: code }
}

export { processVideoEditPipeline }