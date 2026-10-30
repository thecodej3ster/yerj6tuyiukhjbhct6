import { worker } from "../utils/worker"
import crypto from "crypto"
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { createClient } from "@supabase/supabase-js"


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)



async function getIdByUsername(usernames: string[]) {

    const workerUrls: Record<string, string> = {}

    for (let i = 0; i < usernames.length; i++) {
        workerUrls[usernames[i]] = `https://www.instagram.com/${usernames[i]}`
    }


    const workerConfig: WorkerConfig = {
        urls: workerUrls,
        resolverAction: async (args: Record<string, string>) => {
            const accountData = args.response
            const foundUserId = accountData.match(/(?<=props\":{\"id\":\")\d+/)

            if (foundUserId) {
                return foundUserId[0]
            }
            return ""
        },
        requestConfig: {
            method: 'GET'
        }
    }

    const accountIds = await worker(workerConfig)
    return accountIds
    // await fetchPosts(accountIds)
}




async function fetchPosts(accountId: string) {

    interface VideoSearchRespose {
        foundVideos: string[],
        next: string
    }

    interface VideoNode {
        node: { shortcode: string }
    }

    let videoUrls: Record<string, string>[] = []

    const url = `https://www.instagram.com/graphql/query/?doc_id=7950326061742207&variables={"id":"${accountId}","after":"","first":12}`

    const config: WorkerConfig = {
        urls: { posts: url },
        resolverAction: async ({ response }: ResolverArgs): Promise<VideoSearchRespose> => {
            const result: VideoSearchRespose = { foundVideos: [], next: "" }
            // const accountInfo = response as string
            const accountInfo = JSON.parse(response)
            console.log(accountInfo);

            const nodesObjects: VideoNode[] = accountInfo.data.user.edge_owner_to_timeline_media.edges
            result.next = accountInfo.data.user.edge_owner_to_timeline_media.page_info.end_cursor
            nodesObjects.map(nodesObject => result.foundVideos.push(nodesObject.node.shortcode))
            return result
        }
    }


    const { posts } = await worker(config)












    // const send = async (urls: Record<string, string>) => {
    //     const workerConfig: WorkerConfig = {
    //         urls: urls,
    //         resolverAction: async (args: Record<string, string>): Promise<string> => {
    //             let foundVideos: string = ""
    //             const workerResponse: VideoSearchRespose = { foundVideos: "", next: "" }
    //             const response = args.response
    //             const accountInfo = JSON.parse(response)
    //             const nodesObjects: VideoNode[] = accountInfo.data.user.edge_owner_to_timeline_media.edges
    //             workerResponse.next = accountInfo.data.user.edge_owner_to_timeline_media.page_info.end_cursor
    //             nodesObjects.map(nodesObject => foundVideos += `${nodesObject.node.shortcode},`)
    //             workerResponse.foundVideos = foundVideos
    //             return JSON.stringify(workerResponse)
    //         }
    //     }

    //     const workerResponse = await worker(workerConfig)

    //     for (const id in workerResponse) {
    //         try {
    //             const data: VideoSearchRespose = JSON.parse(workerResponse[id])
    //             videoUrls.push(workerResponse)
    //             if (data.next.length) {
    //                 workerUrls[id] = `https://www.instagram.com/graphql/query/?doc_id=7950326061742207&variables={"id":"${id}","after":"${data.next}","first":12}`
    //             } else {
    //                 delete workerUrls[id]
    //             }
    //         } catch (error) {
    //             console.log(error);
    //             console.log(workerResponse[id]);

    //             throw error

    //         }

    //     }


    //     if (!Object.keys(workerUrls).length) {
    //         return
    //     }



    //     await send(workerUrls)
    // }

    // const workerUrls: Record<string, string> = {}

    // for (let i = 0; i < accountIds.length; i++) {
    //     workerUrls[accountIds[i]] =
    //         `https://www.instagram.com/graphql/query/?doc_id=7950326061742207&variables={"id":"${accountIds[i]}","after":"","first":12}`
    // }

    // await send(workerUrls)



    // for (let i = 0; i < videoUrls.length; i++) {
    //     const response = videoUrls[i]
    //     for (const accountId in response) {
    //         const data: VideoSearchRespose = JSON.parse(response[accountId])
    //         const foundVideos: string[] = data.foundVideos.split(",").flat()
    //         foundVideos.pop()
    //         for (let j = 0; j < foundVideos.length; j++) {
    //             const username = Object.fromEntries(Object.entries(accounts).map(([key, val]) => [val, key]))[accountId]
    //             const key = crypto.randomBytes(8).toString("hex")
    //             workerUrls[key] = `https://www.instagram.com/${username}/reel/${foundVideos[j]}/`
    //         }
    //     }
    // }

    // const workerConfig: WorkerConfig = {
    //     urls: workerUrls,
    //     resolverAction: async (args: Record<string, string>): Promise<string> => {
    //         const resolverResponse: { error: string, data: string } = { error: "", data: "" }
    //         const maxDuration = 40
    //         const durationMatch = args.response.match(/(?<=mediaPresentationDuration=\\"PT)[0-9]+/)
    //         if (!durationMatch || Number(durationMatch[0]) > maxDuration) {
    //             resolverResponse.error = "too long"
    //         } else {
    //             const codeMatch = args.response.match(/(?<=reel\/)[^\/]+/)
    //             resolverResponse.data = codeMatch ? codeMatch[0] : ""
    //         }
    //         return JSON.stringify(resolverResponse)
    //     }
    // }

    // const videoFilterWorkerResponse = await worker(workerConfig)
    // const filteredVieos: string[] = []

    // for (const id in videoFilterWorkerResponse) {
    //     const response: { data: string, error: string } = JSON.parse(videoFilterWorkerResponse[id])

    //     if (response.data.length > 0) {
    //         filteredVieos.push(response.data)
    //     }
    // }

    // try {
    //     await savePosts(filteredVieos)
    // } catch (error) {
    //     console.log(error);
    // }
    // console.log(filteredVieos);
}

async function savePosts(posts: string[]) {
    const dbPayload: Record<string, string>[] = []

    for (let i = 0; i < posts.length; i++) {
        console.log(`https://www.instagram.com/reel/${posts[i]}`)

        const field: Record<string, string> = { code: posts[i] }
        dbPayload.push(field)
    }

    const { data, error } = await db.from("videos").insert(dbPayload).select("*")

    if (error) {
        console.log(error);
        throw error
    }

    console.log(data);

}

// const accounts: string[] = ["theflashpoint88","unfilteredstate","thinkerzcircle"]
const accounts: string[] = ["theflashpoint88"]

async function init() {
    const accountIds = await getIdByUsername(accounts)
    await fetchPosts(accountIds[0])
    // for (let i = 0; i < accountIds.length; i++) {
    //     const element = array[i];

    // }
}
