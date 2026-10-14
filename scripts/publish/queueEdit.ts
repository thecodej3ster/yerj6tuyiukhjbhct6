import { createClient } from '@supabase/supabase-js'

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")


async function queue() {
    const { data, error } = await db.rpc('get_random_videos', { row_limit: 20 })

    if (error) {
        console.log('Error fetching videos:', error);
    }

    const selectedVideos = data as { code: string }[]
    console.log(selectedVideos);


    const queuePayload: { code: string }[] = []

    selectedVideos.map(video => {
        queuePayload.push({ code: video.code })
    })

    const { error: videoQueueError } = await db
        .from("editting_queue")
        .insert(queuePayload)

    if (videoQueueError) {
        console.log(videoQueueError);
    }

}

queue()

// editting_queue