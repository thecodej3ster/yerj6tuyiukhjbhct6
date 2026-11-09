import { worker } from "../utils/worker"
import crypto from "crypto"
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { createClient } from "@supabase/supabase-js"


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
const lsd = crypto.randomBytes(8).toString("hex")


let delay = 0

async function getIdByUsername(username: string) {


    const workerConfig: WorkerConfig = {
        urls: { user: `https://www.instagram.com/${username}` },
        resolverAction: async ({ response }: ResolverArgs) => {
            const accountData = response as string
            let userId = ""
            let pageId = ""
            const foundUserId = accountData.match(/(?<=props\":{\"id\":\")\d+/)
            const foundPageId = accountData.match(/(?<={\"end_cursor\":\")[^"]+/m)

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
    if (!user.userId || !user.pageId) {
        delay += 5000

        // return await new Promise<{ userId: string, pageId: string }>((resolve, reject) => {
        //     if (delay === 60000) {
        // console.log('COULD NOT GET USERINFO')
        //         reject("RETRY  LIMIT EXHUASTED")
        //     }
        //     setTimeout(async () => {
        //         const user = await getIdByUsername(username)
        //         resolve(user)
        //     }, delay)
        // })
    }
    return user
}

delay = 0
async function getQueryID({ userId, username }: { userId: string, username: string }) {
    const config: WorkerConfig = {
        urls: { queryId: 'https://www.instagram.com/api/graphql' },
        requestConfig: {
            headers: {
                "origin": 'https://www.instagram.com',
                "content-type": "application/x-www-form-urlencoded",
                "x-fb-lsd": lsd,
                "Referer": `https://www.instagram.com/${username}`
            },
            body: `lsd=${lsd}&variables=${encodeURIComponent(JSON.stringify({ id: userId }))}&doc_id=27840486182295820`,
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
                console.log('COULD NOT GET QUERYID');
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


delay = 0
async function fetchPosts({ username, pageId }: { username: string, pageId?: string }) {

    interface VideoSearchRespose {
        foundVideos: string[],
        next: string
    }

    interface VideoNode {
        node: { code: string }
    }

    let videoUrls: Record<string, string>[] = []

    const variables: { after?: string, first: number, username: string, __relay_internal__pv__PolarisSEOIsCrawlerrelayprovider: boolean } = {
        first: 12,
        username: username,
        __relay_internal__pv__PolarisSEOIsCrawlerrelayprovider: false
    }

    if (pageId) {
        variables.after = pageId
    }


    const config: WorkerConfig = {
        urls: { posts: "https://www.instagram.com/api/graphql" },
        requestConfig: {
            headers: {
                "origin": 'https://www.instagram.com',
                "content-type": "application/x-www-form-urlencoded",
                "x-fb-lsd": lsd,
                "Referer": `https://www.instagram.com/${username}`
            },
            body: `lsd=${lsd}&variables=${encodeURIComponent(JSON.stringify(variables))}&doc_id=29483846714553007`,
            responseType: "json",
            method: "POST"

        },
        resolverAction: async ({ response }: ResolverArgs) => {
            const result: VideoSearchRespose = { foundVideos: [], next: "" }
            const accountInfo = response as { data?: { xig_user_by_username?: { polaris_ordered_timeline_connection?: { edges?: VideoNode[], page_info?: { end_cursor?: string } } } } }
            const nodesObjects: VideoNode[] | undefined = accountInfo?.data?.xig_user_by_username?.polaris_ordered_timeline_connection?.edges

            if (nodesObjects) {
                const next = accountInfo?.data?.xig_user_by_username?.polaris_ordered_timeline_connection?.page_info?.end_cursor
                if (next) {
                    result.next = next
                }
                nodesObjects.map(nodesObject => result.foundVideos.push(nodesObject.node.code))
            }
            return result
        }
    }


    const { posts } = await worker(config) as { posts: VideoSearchRespose }

    console.log(posts);
    console.log("hi");
    
    
    // if (!posts.foundVideos.length) {
    //     delay += 5000
    //     return await new Promise<{ posts: VideoSearchRespose } | VideoSearchRespose>((resolve, reject) => {
    //         if (delay === 60000) {
    //             reject("RETRY  LIMIT EXHUASTED")
    //         }
    //         setTimeout(async () => {
    //             const posts = await fetchPosts({ username: username, pageId: pageId })
    //             resolve(posts)
    //         }, delay)
    //     })
    // }
    return posts













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

        await fetchPosts({ username: username })

        fetchPostsWorkIndex++
        if (fetchPostsWorkIndex === usernames.length) {            
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

    // await runGetUserId()
    // await runGetQueryID()
    // console.log(queryIds);

    // console.log(pageIds);

    await runfetchPosts()

}
init()