import { worker } from "../utils/worker"
import crypto from "crypto"
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { createClient } from "@supabase/supabase-js"


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
const lsd = crypto.randomBytes(8).toString("hex")



async function getIdByUsername(username: string) {

    let delay = 0

    const workerConfig: WorkerConfig = {
        urls: { userId: `https://www.instagram.com/${username}` },
        resolverAction: async ({ response }: ResolverArgs) => {
            const accountData = response as string
            let userId = ""
            let pageId = ""
            const foundUserId = accountData.match(/(?<=props\":{\"id\":\")\d+/)
            const foundPageId = accountData.match(/(?<={\"end_cursor\":\")[^"]+/)

            if (foundUserId) {
                userId = foundUserId[0]
            }

            if (foundPageId) {
                pageId = foundPageId[0]
            }
            return { userId: userId, pageId: pageId }
        }
    }


    const user = await worker(workerConfig) as { userId: string, pageId: string }
    if (!user.userId || user.pageId) {
        delay += 5000
        return await new Promise<{ userId: string, pageId: string }>((resolve, reject) => {
            if (delay === 60000) {
                reject("RETRY  LIMIT EXHUASTED")
            }
            setTimeout(async () => {
                const user = await getIdByUsername(username)
                resolve(user)
            }, delay)
        })
    }
    return user
}

async function getQueryID({ userId, username }: { userId: string, username: string }) {
    let delay = 0
    const config: WorkerConfig = {
        urls: { queryId: 'https://www.instagram.com/api/graphql' },
        requestConfig: {
            headers: {
                "origin": 'https://www.instagram.com',
                "content-type": "application/x-www-form-urlencoded",
                "x-fb-lsd": lsd,
                "Referer": `https://www.instagram.com/${username}`
            },
            body: `lsd=${lsd}&variables=${encodeURIComponent('{"id":"13874292508"}')}&doc_id=27840486182295820`,
            responseType: "json",
            method: "POST"
        },
        resolverAction: async ({ response }: ResolverArgs) => {
            const queryInfo = response as { data?: { xig_user_by_igid_v2?: { id?: string } } }
            return queryInfo?.data?.xig_user_by_igid_v2?.id
        }
    }

    const { queryId } = await worker(config)

    if (!queryId) {
        delay += 5000
        return await new Promise<string>((resolve, reject) => {
            if (delay === 60000) {
                reject("RETRY  LIMIT EXHUASTED")
            }
            setTimeout(async () => {
                const queryId = await getQueryID({ userId: userId, username: username })
                resolve(queryId)
            }, delay)
        })
    }
    return queryId
}



async function fetchPosts({ queryId, username, pageId }: { queryId: string, username: string, pageId: string }) {

    interface VideoSearchRespose {
        foundVideos: string[],
        next: string
    }

    interface VideoNode {
        node: { shortcode: string }
    }

    let delay = 0
    let videoUrls: Record<string, string>[] = []
    const url = "https://www.instagram.com/api/graphql"

    const variables = {
        after: pageId,
        first: 12,
        id: queryId,
        __relay_internal__pv__PolarisSEOIsCrawlerrelayprovider: false
    }


    const config: WorkerConfig = {
        urls: { posts: url },
        requestConfig: {
            headers: {
                "origin": 'https://www.instagram.com',
                "content-type": "application/x-www-form-urlencoded",
                "x-fb-lsd": lsd,
                "Referer": `https://www.instagram.com/${username}`
            },
            body: 'lsd=AdRXMrl7XuP_BlBb1TYbntj7-Uc&variables=%7B%22after%22%3A%22AQHT5K2M9u79cg-vKWpI2onBukkAn7984X3Q9sDC9KzoDl4hbDUr4uIPRYuBe3Xdt2WXkhwQ7EjjOq-3wUnL1Opygg%22%2C%22first%22%3A12%2C%22id%22%3A%2217841413815264286%22%2C%22__relay_internal__pv__PolarisSEOIsCrawlerrelayprovider%22%3Afalse%7D&doc_id=28904005159232689',
            // `lsd=${lsd}&variables=${encodeURIComponent(JSON.stringify(variables))}&doc_id=28904005159232689`,
            responseType: "json",
            method: "POST"

        },
        resolverAction: async ({ response }: ResolverArgs) => {
            const result: VideoSearchRespose = { foundVideos: [], next: "" }
            // const accountInfo = JSON.parse(response)
            console.log(response);

            // const nodesObjects: VideoNode[] = accountInfo.data.user.edge_owner_to_timeline_media.edges
            // result.next = accountInfo.data.user.edge_owner_to_timeline_media.page_info.end_cursor
            // nodesObjects.map(nodesObject => result.foundVideos.push(nodesObject.node.shortcode))
            // return result
        }
    }


    const { posts } = await worker(config)

    // if (!queryId) {
    //     delay += 5000
    //     return await new Promise<string>((resolve, reject) => {
    //         if (delay === 60000) {
    //             reject("RETRY  LIMIT EXHUASTED")
    //         }
    //         setTimeout(async () => {
    //             const queryId = await getQueryID({ userId: userId, username: username })
    //             resolve(queryId)
    //         }, delay)
    //     })
    // }
    console.log(posts);













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

async function init() {
    const usernames: string[] = ["theflashpoint88"]
    const userIds: string[] = []
    const pageIds: Record<string, string> = {}
    const queryIds: Record<string, string> = {}

    let userIDWorkIndex = 0
    const runGetUserId = async () => {
        const username = usernames[userIDWorkIndex]
        const user = await getIdByUsername(username)
        userIds.push(user.userId)
        pageIds[username] = user.pageId
        userIDWorkIndex++

        if (userIDWorkIndex === usernames.length) {
            return
        }
        await runGetUserId()
    }

    let fetchPostsWorkIndex = 0
    const runfetchPosts = async () => {
        const username = usernames[fetchPostsWorkIndex]

        await fetchPosts({ username: username, queryId: queryIds[fetchPostsWorkIndex], pageId: pageIds[username] })

        fetchPostsWorkIndex++
        if (fetchPostsWorkIndex === userIds.length) {
            return
        }
        await runfetchPosts()
    }

    let getQueryIdWorkIndex = 0
    const runGetQueryID = async () => {
        const username = usernames[getQueryIdWorkIndex]
        queryIds[username] = await getQueryID({ username: username, userId: userIds[getQueryIdWorkIndex] })

        getQueryIdWorkIndex++
        if (getQueryIdWorkIndex === userIds.length) {
            return
        }
        await runGetQueryID()
    }

    await runGetUserId()
    await runGetQueryID()
    await runfetchPosts()
    console.log(lsd);

}
init()