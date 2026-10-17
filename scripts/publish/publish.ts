import { retrive } from "../utils/retriveVideo";
import { createClient } from "@supabase/supabase-js";
import { processCropPipeline } from "../edit/crop";
import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import keys from "./keys.json"
import { createSchedule, deleteSchedule } from "./schedule";
import jobStore from './jobs.json'
import { initSchedule } from "./schedule";
import fs from 'fs'

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

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

    console.log(key);
    const organizationsQuery = `
    query GetAccountAndChannels {
      account {
        organizations {
          id
          name
        }
      }
    }
  `;


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

    console.log(organizations);

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

    config.urls = { channelInfo: "https://api.buffer.com" }
    if (config.requestConfig) {
        config.requestConfig.body = JSON.stringify({
            query: channelsQuery,
            variables: { organizationId: organizations.data.account.organizations[0].id }
        })
    }

    const { channelInfo } = await worker(config) as { channelInfo: ChannelInfo }

    console.log(channelInfo);

    return channelInfo.data.channels[0].id
}


async function getVideo(id: string) {
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
        time: number;
        jobId: string
    };
}

async function manageSchedule(video_id: string) {
    const postingHours = [6, 11, 17, 23]
    const eventPath = process.env.GITHUB_EVENT_PATH;

    if (!eventPath) {
        throw new Error("GITHUB_EVENT_PATH environment variable is not set.");
    }

    const rawData = fs.readFileSync(eventPath, 'utf8');
    const { inputs }: WorkflowDispatchEvent = JSON.parse(rawData);

    await deleteSchedule(inputs.jobId)

    const selectedMinutes = Math.max(5, Math.round(Math.random() * 20))

    await createSchedule({ hours: rotate(postingHours, inputs.time), username: inputs.username, minutes: selectedMinutes })

    await db
        .from("video_descriptions")
        .delete()
        .eq("video_id", video_id)

    return {
        username: inputs.username
    }
}


async function publish() {
    if (!Object.keys(jobStore.jobs).length) {
        await initSchedule()
        return
    }

    const video = await processCropPipeline()

    if (!video) {
        return
    }

    const videoInfo = await getVideo(video.videoId)
    if (!videoInfo) {
        return
    }
    const { videoUrl, description } = videoInfo

    if (!videoUrl || !description) {
        return
    }
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

    const { username } = await manageSchedule(videoInfo.id)
    return
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
    console.log(postInfo);
}

publish()