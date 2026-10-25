import { retrive } from "../utils/retriveVideo";
import { createClient } from "@supabase/supabase-js";
import { processCropPipeline } from "../edit/crop";
import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import { createSchedule, deleteSchedule } from "./schedule";
import { initSchedule } from "./schedule";
import fs from 'fs'

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
const keys = JSON.parse(process.env.Creds!)



let getVideoRetries = 0
async function getVideo(id: string) {
    try {
        const video = await retrive({ table: "editted_videos", autoDelete: true, download: true, id: id })

        const { data: videoDescription, error } = await db
            .from("video_descriptions")
            .select("*")
            .eq("video_id", id)
            .limit(1)
            .single()

        if (error) {
            throw error
        }

        return { videoUrl: video.url, description: videoDescription.content, id: video.video_id }
    } catch (error) {
        getVideoRetries++
        if (getVideoRetries === 3) {
            throw error
        }

        return await new Promise<any>((resolve) => {
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

interface WorkflowDispatchEvent {
    inputs: {
        username: string;
        time: string;
        jobId: string
    };
}

async function manageSchedule() {
    const postingHours = [6, 11, 18, 23]
    const eventPath = process.env.GITHUB_EVENT_PATH;


    if (!eventPath) {
        throw new Error("GITHUB_EVENT_PATH environment variable is not set.");
    }


    const rawData = fs.readFileSync(eventPath, 'utf8');
    const { inputs }: WorkflowDispatchEvent = JSON.parse(rawData);

    if (inputs.jobId === "init") {
        await initSchedule()
        return {
            username: "",
            shouldPublish: false,
            jobId: 0
        }
    }

    console.log(inputs.jobId);

    const { data: job, error } = await db.from("jobs")
        .select("*")
        .eq("id", inputs.jobId)
        .limit(1)
        .single<{ job_id: number }>()

    if (error) {
        console.log(error);
        throw error
    }

    const selectedMinutes = Math.max(5, Math.round(Math.random() * 20))
    const selectedHours = rotate(postingHours, Number(inputs.time.trim()))

    await createSchedule({ hours: selectedHours, username: inputs.username, minutes: selectedMinutes })

    return {
        username: inputs.username,
        shouldPublish: true,
        jobId: job.job_id
    }
}


async function publish() {
    // console.log(process.env);
    let schedule
    let video
    try {
        schedule = await manageSchedule()
        const { username, shouldPublish, jobId } = schedule

        if (!shouldPublish) {
            return
        }

        if (!username || !jobId) {
            console.log(`USERNAME IS ${username}`);
            console.log(`JOBID IS ${jobId}`);
            throw new Error('Expected Arg is Mising')
        }

        video = await processCropPipeline()
        const { videoId } = video

        const { videoUrl, description } = await getVideo(videoId)

        console.log(videoUrl);

        const publishQuery = `
        mutation ShareReelNow($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess {
              post {
                id
                status
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `;

        const keyStore = keys as Record<string, string>
        const key = keyStore[username]

        const channelId = await getChannelId(key)

        const payload = {
            input: {
                text: description,
                channelId: channelId,
                schedulingType: "automatic",
                mode: "shareNow",
                metadata: {
                    instagram: {
                        type: "reel",
                        shouldShareToFeed: true
                    }
                },
                assets: [
                    {
                        video: {
                            url: videoUrl
                        }
                    }
                ]
            }
        }

        const config: WorkerConfig = {
            urls: {
                postInfo: "https://api.buffer.com"
            },
            requestConfig: {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`,
                },
                body: JSON.stringify({ query: publishQuery, variables: payload }),
                responseType: "json",
                method: "POST"
            }

        }

        const { postInfo } = await worker(config)
    } finally {
        if (schedule) {
            await deleteSchedule(`${schedule.jobId}`)
        }

        if (video) {
            const { error } = await db
                .from("video_descriptions")
                .delete()
                .eq("video_id", video.videoId)

            console.log(error);
        }

    }
}

publish()
    .then(() => {
        console.log('CLIPPING PIPELINE SUCESSFULLY EXECUTED');
    })