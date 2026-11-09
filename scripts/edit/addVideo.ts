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
interface VideoSearchRespose {
    foundVideos: string[],
    next: string
}

interface VideoNode {
    node: { code: string }
}
async function fetchPosts({ username, pageId }: { username: string, pageId?: string }) {

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

    if (!posts.foundVideos.length) {
        delay += 5000
        return await new Promise<VideoSearchRespose>((resolve, reject) => {
            if (delay === 60000) {
                reject("RETRY  LIMIT EXHUASTED")
            }
            setTimeout(async () => {
                const { posts } = await worker(config) as { posts: VideoSearchRespose }
                resolve(posts)
            }, delay)
        })
    }
    return posts
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

async function sortVideos({ response }: ResolverArgs) {
    const videoData = response as string
    const maxDuration = 41
    const durationMatch = videoData.match(/(?<=mediaPresentationDuration=\\"PT)[0-9]+/)

    if (durationMatch && Number(durationMatch[0]) < maxDuration) {
        const videoCode = videoData.match(/(?<=reel\/)[^\/]+/)
        if (videoCode) {
            return { code: videoCode[0] }
        }
    }
    return null
}

async function init() {
    const usernames: string[] = ["theflashpoint88"]
    const userIds: string[] = []
    const pageIds: Record<string, string> = {}
    const queryIds: Record<string, string> = {}
    const posts: Record<string, VideoSearchRespose> = {}

    let fetchPostsWorkIndex = 0
    const runfetchPosts = async () => {
        const username = usernames[fetchPostsWorkIndex]

        posts[username] = await fetchPosts({ username: username })

        fetchPostsWorkIndex++
        if (fetchPostsWorkIndex === usernames.length) {
            return
        }
        await runfetchPosts()
    }

    await runfetchPosts()

    let sortVideosWorkIndex = 0
    const runSortVideo = async () => {
        const username = usernames[sortVideosWorkIndex]
        const videos = posts[username].foundVideos
        const urls: Record<string, string> = {}

        if (videos.length) {
            videos.map(code => {
                const id = crypto.randomBytes(8).toString("hex")
                urls[id] = `https://www.instagram.com/${username}/reel/${code}/`
            })
            const config: WorkerConfig = { urls: urls, resolverAction: sortVideos }
            const sortedVideos = await worker(config) as Record<string, { code: string }>
            const dbPayload = Object.values(sortedVideos)
            const { data, error } = await db.from('videosX').insert(dbPayload).select()
            if (error) {
                throw new Error(error.message);
            }
            console.log(data);


        }

        sortVideosWorkIndex++
        if (sortVideosWorkIndex === usernames.length) {
            return
        }
        await runSortVideo()
    }
    await runSortVideo()

    let iteratePaginationWorkIndex = 0
    const iteratePagination = async () => {
        const username = usernames[iteratePaginationWorkIndex]
        const page = posts[username].next





    }

}
init()