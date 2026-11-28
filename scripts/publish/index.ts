import { EventPayload } from "./utils/types"
import { initSchedule, createSchedule, deleteSchedule } from './schedule'
import { createClient } from '@supabase/supabase-js'
import { processVideoEditPipeline } from "../edit"
import igPublish from './instagram'
import ytPublish from './youtube'
import fs from 'fs'
import { register } from "../submit/track/addTrackPoint"


interface Video {
    videoUrl: string
    description: string
    id: string
    hook: string
}

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

async function getVideoMetaData(id: string) {
    console.log('GETTING VIDEO METADATA');

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
    return { description: videoDescription.content, hook: hook }

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
    const igPostingHours = [6, 11, 18, 23]
    const ytPostingHours = [18, 2]
    let postingHours: number[] = []

    console.log(`POSTING FOR ${username.toUpperCase()}`);


    if (time === 'init' && username === 'init' && jobId === 'init') {
        await initSchedule()
        await register()
        return
    }

    const { videoUrl, code } = await processVideoEditPipeline()
    const { description, hook } = await getVideoMetaData(code)

    if (time !== 'init' && username !== 'init' && jobId !== "init") {
        try {
            const title = JSON.parse(hook.hook)
            let payload: any = {}
            switch (true) {
                case username.includes("instagram"):
                    payload = { url: videoUrl, key: key, description: description, title: title.lines.join(' ') }
                    postingHours = igPostingHours
                    await igPublish(payload)
                    break;
                case username.includes("youtube"):
                    payload = { url: videoUrl, key: key, title: title.lines.join(' ') }
                    postingHours = ytPostingHours
                    await ytPublish(payload)
                    break;
            }

            const selectedMinutes = Math.max(5, Math.round(Math.random() * 20))
            const selectedHours = rotate(postingHours, Number(inputs.time.trim()))
            await createSchedule({ hours: selectedHours, username: username, minutes: selectedMinutes })
            return
        } catch (_) {
            const minutes = (new Date().getMinutes()) + 5
            if (minutes < 60) {
                await createSchedule({ hours: Number(time), username: username, minutes: minutes })
            } else {
                const selectedMinutes = Math.max(5, Math.round(Math.random() * 20))
                const selectedHours = rotate(postingHours, Number(inputs.time.trim()))
                await createSchedule({ hours: selectedHours, username: username, minutes: selectedMinutes })
                throw new Error(`COULD NOT POST FOR ${username.toUpperCase()}`);
            }
        } finally {

            let apiJobId = 0

            const { data, error } = await db.from("jobs")
                .select("*")
                .eq("id", jobId)
                .limit(1)
                .single<{ job_id: number }>()

            if (error) {
                console.log(error);
                throw error
            }

            apiJobId = data.job_id
            await deleteSchedule(`${apiJobId}`)

            const { error: descriptionError } = await db
                .from("video_descriptions")
                .delete()
                .eq("video_id", code)

            if (descriptionError) {
                console.log(descriptionError);
                throw error
            }

            const { error: hookError } = await db
                .from("video_hooks")
                .delete()
                .eq("video_id", code)

            if (hookError) {
                console.log(hookError);
                throw error
            }

        }
    }

}

init()