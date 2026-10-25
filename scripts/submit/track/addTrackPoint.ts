import { createClient } from "@supabase/supabase-js";
import { worker } from "../../utils/worker";
import { WorkerConfig } from "../../utils/types";
import { PostRecord } from "./types";
import { ResolverArgs } from "../../utils/types";
import crypto from "crypto"
import { URL } from "url";

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

async function makePayload({ response: arg1, platform }: ResolverArgs & { platform?: string }) {
    const response = arg1 as string
    
    const payloads: (PostRecord & { updated_at: string })[] = []

    switch (platform) {
        case "instagram":
            const postIdSearch = response.match(/(?<=\"GraphVideo\\",\\"id\\":\\")\d+/gm)
            const igUserNameSearch = response.match(/(?<=user[?]username=).+?(?=[&])/)

            if (!postIdSearch) {
                throw new Error("Could Not Find IG PostID");
            }

            if (!igUserNameSearch) {
                throw new Error("Could Not Find IG Username");
            }

            const igPayload: PostRecord & { updated_at: string } = {
                username: igUserNameSearch[0],
                post_id: postIdSearch[0],
                platform: "instagram",
                updated_at: new Date().toISOString()
            }

            payloads.push(igPayload)
            break;

        case "youtube":
            const ytUserNameSearch = response.match(/(?<=Go\sto\schannel\s@)[^\"]+?"(?=,\"rendererContext\":{\"commandCont)/m)
            const videoIdSearch = response.match(/(?<=\"videoDetails\":{\"videoId\":\")[^\"]+/m)

            if (!ytUserNameSearch) {
                throw new Error("Could Not Find YT Username");
            }

            if (!videoIdSearch) {
                throw new Error("Could Not Find YT VideoId");
            }

            const username = ytUserNameSearch[0].replace('"', '')
            const videoId = videoIdSearch[0]

            const ytPayload: PostRecord & { updated_at: string } = {
                username: username,
                post_id: videoId,
                platform: "youtube",
                updated_at: new Date().toISOString()
            }
            payloads.push(ytPayload)

            break;
    }

    return payloads
}


async function add(urls: string[]) {
    const igWorkerUrls: Record<string, string> = {}
    const ytWorkerUrls: Record<string, string> = {}
    const igUrls: string[] = []
    const ytUrls: string[] = []
    const trackPoints: string[] = []

    urls.map(url => {
        switch (true) {
            case url.includes("youtube"):
                ytUrls.push(url)
                break
            case url.includes("instagram"):
                igUrls.push(url)
                break
        }
    })

    igUrls.map(url => {
        const id = crypto.randomBytes(8).toString("hex")
        const parsedUrl = new URL(url)
        igWorkerUrls[id] = `https://${parsedUrl.hostname}${parsedUrl.pathname}/embed/captioned/`
    })


    if (igUrls.length) {
        const igConfig: WorkerConfig = { urls: igWorkerUrls, resolverAction: makePayload, resolverArgs: { platform: "instagram" } }
        const igPostIdResponses = await worker(igConfig)
        trackPoints.concat(Object.values(igPostIdResponses))
    }

    ytUrls.map(url => {
        const id = crypto.randomBytes(8).toString("hex")
        ytWorkerUrls[id] = url
    })


    if (ytUrls.length) {
        const ytConfig: WorkerConfig = { urls: ytWorkerUrls, resolverAction: makePayload, resolverArgs: { platform: "instagram" } }
        const ytPostIdResponses = await worker(ytConfig)
        trackPoints.concat(Object.values(ytPostIdResponses))
    }


    console.log(trackPoints)
    // const { error } = await db
    //     .from('track_points')
    //     .upsert(trackPoints, { onConflict: 'username' })

    // if (error) {
    //     throw error
    // }

}

add(["https://www.youtube.com/shorts/8JZhpUPjia8", "https://www.youtube.com/shorts/8JZhpUPjia8", "https://www.youtube.com/shorts/8JZhpUPjia8", "https://www.youtube.com/shorts/8JZhpUPjia8", "https://www.youtube.com/shorts/8JZhpUPjia8", "https://www.youtube.com/shorts/8JZhpUPjia8",])
