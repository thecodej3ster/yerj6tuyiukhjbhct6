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

            return igPayload

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
            return ytPayload
    }

}


async function add(urls: string[]) {
    const igWorkerUrls: Record<string, string> = {}
    const ytWorkerUrls: Record<string, string> = {}
    const igUrls: string[] = []
    const ytUrls: string[] = []
    let trackPoints: string[] = []

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
        trackPoints = trackPoints.concat(Object.values(igPostIdResponses))
    }

    ytUrls.map(url => {
        const id = crypto.randomBytes(8).toString("hex")
        ytWorkerUrls[id] = url
    })

    if (ytUrls.length) {
        const ytConfig: WorkerConfig = { urls: ytWorkerUrls, resolverAction: makePayload, resolverArgs: { platform: "youtube" } }
        const ytPostIdResponses = await worker(ytConfig)
        trackPoints = trackPoints.concat(Object.values(ytPostIdResponses))
    }


    console.log(trackPoints)
    const { error } = await db
        .from('track_points')
        .upsert(trackPoints, { onConflict: 'username,platform' })

    if (error) {
        console.log(error);
        throw error
    }

}

const usernames = Object.keys(JSON.parse(process.env.Creds!))

async function getLatestPostId({ response }: ResolverArgs) {
    const accountData = response as string
    const recentPostSearchMatch = accountData.match(/(?<=\"pk\":\")\d+(?=\",\"code":\")/g)

    if (recentPostSearchMatch) {
        const recentPostSearchMatchArray = Array.from(recentPostSearchMatch)
        recentPostSearchMatchArray.sort((a, b) => {
            const diff = BigInt(b) - BigInt(a);
            return diff > 0n ? 1 : diff < 0n ? -1 : 0;
        })

        if (recentPostSearchMatchArray.length > 1) {
            return recentPostSearchMatchArray[1]
        } else {
            return recentPostSearchMatchArray[0]
        }
    }

    return response
}

async function register() {
    const igAccounts: string[] = []
    const ytAccounts: string[] = []
    const igUrls: Record<string, string> = {}
    const ytUrls: Record<string, string> = {}
    const postIds:Record<string, string> = {}

    usernames.map(username => {
        switch (true) {
            case username.includes("instagram"):
                igAccounts.push(username)
                break;
            case username.includes("youtube"):
                ytAccounts.push(username)
                break;
        }
    })

    igAccounts.map(account => {
        const username = account.toLowerCase().replace('_instagram', '').trim()
        igUrls[username] = `https://www.instagram.com/${username}`
    })

    const igConfig: WorkerConfig = {
        urls: igUrls,
        resolverAction: getLatestPostId
    }


    const runGetPostID = async () => {
        const latestPostIds = await worker(igConfig)
        for (const key in latestPostIds) {
            const postId = latestPostIds[key]
            if (!/[a-zA-Z]/.test(postId)) {
                postIds[key] = postId
                delete igUrls[key]
            }

            if (Object.keys(igUrls).length) {
                await runGetPostID()
            }

        }
    }

    await runGetPostID()
    console.log(postIds)
}


// const urls = ["https://www.instagram.com/p/DfRpY2gjhhq"]

// add(urls)

register()