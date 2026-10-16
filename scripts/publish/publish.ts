import { retrive } from "../utils/retriveVideo";
import { createClient } from "@supabase/supabase-js";
import { processCropPipeline } from "../crop";
import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import store from "./config.json"

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

    console.log(error);


    return { videoUrl: video.url, description: videoDescription, id: video.video_id }
}

let i = 0

async function cleanUp(video_id: string) {
    await db
        .from("video_descriptions")
        .delete()
        .eq("video_id", video_id)
}


async function publish() {
    const video = await processCropPipeline()
    if (!video) {
        return
    }

    const { videoUrl, description } = await getVideo(video.videoId)

    console.log(videoUrl);
    console.log(description);
    return


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



    const account = store.accounts[i]
    const channelId = await getChannelId(account.key)

    const payload = {
        input: {
            text: description,
            channelId: channelId,
            schedulingType: "automatic",
            mode: "shareNow",
            assets: [
                {
                    url: videoUrl,
                    type: "video"
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
                "Authorization": `Bearer ${account.key.trim()}`,
            },
            body: { query: publishQuery, variables: payload },
            responseType: "json"
        }
    }

    const { postInfo } = await worker(config)

    i++
    if (i < store.accounts.length) {
        await publish()
    }

}

publish()

