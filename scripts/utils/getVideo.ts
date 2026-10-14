import { worker } from "./worker"
import { WorkerConfig } from './types';
import { createClient } from '@supabase/supabase-js'


type Video = {
    code: string
    url: string
}

// const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
// const tkn = process.env.Keep_key

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")



function cleanUrl(rawUrl: string): string {
    let cleaned = rawUrl.replace(/\\+\//g, '/')
    cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    )
    try {
        cleaned = decodeURIComponent(cleaned)
    } catch (e) {
    }
    return cleaned
}

export async function getVideo(
    { isRandom, table, code, autoDelete }
        : { isRandom?: boolean, table: string, code?: string, autoDelete?: boolean }
): Promise<Record<string, string> | null> {

    const selectVideo = async (): Promise<Video | null> => {
        let video: Video | null
        let videoSelectError
        if (isRandom && !code) {
            const { count, error: countError } = await db
                .from(table)
                .select('*', { count: 'exact', head: true })

            if (countError || count === null || count === 0) {
                console.error('Error fetching count:', countError)
                return null
            }

            const randomIndex = Math.floor(Math.random() * count)

            const { data, error } = await db
                .from(table)
                .select('*')
                .range(randomIndex, randomIndex)
                .single<Video>()
            video = data

            videoSelectError = error
        } else if (code) {
            const { data, error } = await db
                .from(table)
                .select('*')
                .eq("code", code)
                .limit(1)
                .single<Video>()
            video = data
            videoSelectError = error
        } else {
            const { data, error } = await db
                .from(table)
                .select('*')
                .limit(1)
                .single<Video>()
            video = data
            videoSelectError = error
        }
        if (videoSelectError || !video || !video.code) {
            console.error('Error selecting video:', videoSelectError)
            return null
        }


        return video
    }

    let selectedVideo = await selectVideo()

    if (!selectedVideo) {
        return null
    }

    const workerConfig: WorkerConfig = { urls: { videoUrl: `https://www.instagram.com/reel/${selectedVideo.code}` } }

    workerConfig.resolverAction = async (args): Promise<string | null> => {
        const response = args.response.match(/(?<=\"url\"\:\")[^}]+?mp4[^}"]+(?=")/m)
        if (response) {
            return response[0]
        }
        return null
    }
    const { videoUrl } = await worker(workerConfig)

    if (autoDelete) {
        const { error } = await db.from(table)
            .delete()
            .eq("code", code)

        if (error) {
            console.log(error);
        }
    }
    
    return { url: cleanUrl(videoUrl) }
}
// getVideo({ table: "videos", isRandom: true })