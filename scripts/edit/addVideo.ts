import { worker } from "../utils/worker"
import crypto from "crypto"
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { createClient } from "@supabase/supabase-js"


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
const lsd = crypto.randomBytes(8).toString("hex")
let delay = 0

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


async function sortVideos({ response }: ResolverArgs) {
    const videoData = response as string
    const maxDuration = 41
    const durationMatch = videoData.match(/(?<=mediaPresentationDuration=\\"PT)[0-9]+/)

    if (!durationMatch) {
        return "error"
    }

    if (durationMatch && Number(durationMatch[0]) < maxDuration) {
        const videoCode = videoData.match(/(?<=reel\/)[^\/]+/)
        if (videoCode) {
            return { code: videoCode[0] }
        }
    }
    return null
}

async function init() {
    const usernames: string[] = ["_unfiltered.talk_"]
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
    const runSortVideo = async (currentUser = "") => {
        let videoUrls: Record<string, string> = {}
        let validVideos: { code: string }[] = []

        const run = async () => {
            const username = currentUser || usernames[sortVideosWorkIndex]
            const videos = posts[username].foundVideos

            if (!videos.length) {
                return
            }

            videos.map(code => {
                const id = crypto.randomBytes(8).toString("hex")
                videoUrls[id] = `https://www.instagram.com/${username}/reel/${code}/`
            })

            const config: WorkerConfig = { urls: videoUrls, resolverAction: sortVideos }
            const sortedVideos = await worker(config) as Record<string, { code: string } | string | null>

            const sucessfulVideos = [...Object.values(sortedVideos).filter(v => v !== null && !v.toString().toLowerCase().includes("error"))] as { code: string }[]
            validVideos = validVideos.concat(sucessfulVideos)

            videoUrls = {}
            for (const key in sortedVideos) {
                if (typeof sortedVideos[key] === "object" && sortedVideos[key]?.code) {
                    delete videoUrls[key]
                }
            }

            if (Object.keys(videoUrls).length) {
                delay += 5000
                return await new Promise<void>((resolve, reject) => {
                    if (delay === 60000) {
                        reject("RETRY  LIMIT EXHUASTED")
                    }
                    setTimeout(async () => {
                        await run()
                        resolve()
                    }, delay)
                })
            }
            delay = 0
        }

        await run()

        const { data, error } = await db.from('videos').insert(validVideos).select()
        if (error) {
            throw new Error(error.message);
        }
        console.log(data);

        if (currentUser) {
            return
        }

        validVideos = []
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
        const pageId = posts[username].next

        if (!pageId) {
            return
        }

        posts[username] = await fetchPosts({ username: username, pageId: pageId })
        await runSortVideo(username)
        if (posts[username].next) {
            return await iteratePagination()
        }

        iteratePaginationWorkIndex++
        if (iteratePaginationWorkIndex === usernames.length) {
            return
        }
        await iteratePagination()
    }
    await iteratePagination()
}
init()