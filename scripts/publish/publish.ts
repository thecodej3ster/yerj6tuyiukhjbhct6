import { retrive } from "../utils/retriveVideo";
import { createClient } from "@supabase/supabase-js";
import { processCropPipeline } from "../edit/crop";
import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import keys from "./keys.json"
import { createSchedule, deleteSchedule } from "./schedule";
import { initSchedule } from "./schedule";
import fs from 'fs'

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

let getChannelIdRetries = 0
async function getChannelId(key: string) {
    type OrganizationInfo = {
        data: {
            account: {
                organizations: [
                    {
                        id: string,
                        name: string
                    }
                ]
            }
        }
    }

    type Channel = {
        id: string,
        name: string,
        displayName: string,
        service: string
    }

    type ChannelInfo = {
        data: {
            channels: Channel[]
        }
    }

    const organizationsQuery = `
    query GetAccountAndChannels {
      account {
        organizations {
          id
          name
        }
      }
    }
  `
    const channelsQuery = `
        query GetChannels($organizationId: OrganizationId!) {
          channels(input: { organizationId: $organizationId }) {
            id
            name
            displayName
            service
          }
        }
      `


    try {
        let config: WorkerConfig = {
            urls: {
                organizations: "https://api.buffer.com"
            },
            requestConfig: {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key.trim()}`,
                },
                method: "POST",
                body: JSON.stringify({ query: organizationsQuery }),
                responseType: "json"
            }
        }

        const { organizations } = await worker(config) as { organizations: OrganizationInfo }

        config.urls = { channelInfo: "https://api.buffer.com" }
        if (config.requestConfig) {
            config.requestConfig.body = JSON.stringify({
                query: channelsQuery,
                variables: { organizationId: organizations.data.account.organizations[0].id }
            })
        }

        const { channelInfo } = await worker(config) as { channelInfo: ChannelInfo }

        return channelInfo.data.channels[0].id
    } catch (error) {
        getChannelIdRetries++
        if (getChannelIdRetries === 3) {
            throw error
        }

        return await new Promise<any>((resolve) => {
            setTimeout(async () => {
                const result = await getChannelId(key)
                resolve(result)
            }, 3000);
        })
    }
}

let getVideoRetries = 0
async function getVideo(id: string) {
    try {
        const video = await retrive({ table: "editted_videos", autoDelete: true, download: true })

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
            username: null,
            shouldPublish: false
        }
    }

    console.log(inputs.jobId);

    const { data: job, error } = await db.from("jobs")
        .select("*")
        .eq("id", inputs.jobId)
        .limit(1)
        .single()

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

    const { username, shouldPublish, jobId } = await manageSchedule()

    if (!shouldPublish) {
        return
    }

    if (!username || !jobId) {
        console.log(`USERNAME IS ${username}`);
        console.log(`JOBID IS ${jobId}`);
        throw new Error('Expected Arg is Mising')
    }

    let { videoId } = await processCropPipeline()

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

    // return
    // const keyStore = keys as Record<string, string>
    // const key = keyStore[username]

    // const channelId = await getChannelId(key)

    // const payload = {
    //     input: {
    //         text: description,
    //         channelId: channelId,
    //         schedulingType: "automatic",
    //         mode: "shareNow",
    //         metadata: {
    //             instagram: {
    //                 type: "reel",
    //                 shouldShareToFeed: true
    //             }
    //         },
    //         assets: [
    //             {
    //                 video: {
    //                     url: videoUrl
    //                 }
    //             }
    //         ]
    //     }
    // }

    // const config: WorkerConfig = {
    //     urls: {
    //         postInfo: "https://api.buffer.com"
    //     },
    //     requestConfig: {
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Authorization": `Bearer ${key}`,
    //         },
    //         body: JSON.stringify({ query: publishQuery, variables: payload }),
    //         responseType: "json",
    //         method: "POST"
    //     }

    // }

    // const { postInfo } = await worker(config)
    // console.log(postInfo);

    //shoulds be last
    await deleteSchedule(jobId)

    await db
        .from("video_descriptions")
        .delete()
        .eq("video_id", videoId)
}

publish()