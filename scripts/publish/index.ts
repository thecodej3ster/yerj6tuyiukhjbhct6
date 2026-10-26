import { EventPayload } from "./utils/types"
import { initSchedule, createSchedule, deleteSchedule } from './schedule'
import { createClient } from '@supabase/supabase-js'
import { processCropPipeline } from '../edit/crop'
import { retrive } from '../utils/retriveVideo'
import fs from 'fs'
import igPublish from './instagram'
import ytPublish from './youtube'


interface Video {
    videoUrl: string
    description: string
    id: string
    hook: string
}

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

let getVideoRetries = 0
async function getVideo(id: string) {
    console.log('GETTING VIDEO');
    
    try {
        const video = await retrive({ table: "editted_videos", autoDelete: true, download: true, id: id }) as { url: string; video_id: string; }

        const { data: videoDescription, error } = await db
            .from("video_descriptions")
            .select("*")
            .eq("video_id", id)
            .limit(1)
            .single()

        if (error) {
            console.log('DESCRIPTION ERROR');
            console.log(error);
            throw error
        }

        const { data: hook, error: hookError } = await db
            .from("video_hooks")
            .select("*")
            .eq("video_id", id)
            .limit(1)
            .single()

        if (hookError) {
            console.log("HOOK ERROR");
            
            console.log(hookError);
            throw error
        }
        return { videoUrl: video.url, description: videoDescription.content, id: video.video_id, hook: hook }
    } catch (error) {
        getVideoRetries++
        if (getVideoRetries === 3) {
            throw error
        }

        return await new Promise<Video>((resolve) => {
            setTimeout(async () => {
                const result = await getVideo(id)
                resolve(result)
            }, 3000);
        })
    }
}


function rotate(list: any[], currentElement: any) {
    const currentIndex = list.indexOf(currentElement)
    let nextIndex = currentIndex === list.length - 1 ? 0 : currentIndex + 1
    const nextElement = list[nextIndex]
    return nextElement
}


async function init() {
    const eventPath = process.env.GITHUB_EVENT_PATH!
    const { inputs }: { inputs: EventPayload } = JSON.parse(fs.readFileSync(eventPath, "utf8"))
    const { username, jobId, time } = inputs
    const keys = JSON.parse(process.env.Creds!)
    const key = keys[username]
    const postingHours = [6, 11, 18, 23]
    let videoId = ""

    try {
        if (time === 'init') {
            await initSchedule()
            return
        }

        const video = await processCropPipeline()
        videoId = video.videoId

        const { videoUrl, description, hook } = await getVideo(videoId)
        const payload = { url: videoUrl, key: key, description: description, title: hook }

        switch (true) {
            case username.includes("instagram"):
                await igPublish(payload)
                break;
            case username.includes("youtube"):
                await ytPublish(payload)
                break;
        }

        const selectedMinutes = Math.max(5, Math.round(Math.random() * 20))
        const selectedHours = rotate(postingHours, Number(inputs.time.trim()))

        await createSchedule({ hours: selectedHours, username: inputs.username, minutes: selectedMinutes })
    } finally {
        const { data, error } = await db.from("jobs")
            .select("*")
            .eq("id", jobId)
            .limit(1)
            .single<{ job_id: number }>()

        if (error) {
            console.log(error);
            throw error
        }

        const apiJobId = data.job_id

        if (time !== 'init') {
            await deleteSchedule(`${apiJobId}`)
        }

        if (videoId) {
            const { error } = await db
                .from("video_descriptions")
                .delete()
                .eq("video_id", videoId)

            if (error) {
                console.log(error);
                throw error
            }


            const { error: hookError } = await db
                .from("video_hooks")
                .delete()
                .eq("video_id", videoId)

            if (hookError) {
                console.log(hookError);
                throw error
            }
        }
    }
}

init()