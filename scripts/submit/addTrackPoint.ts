import { createClient } from "@supabase/supabase-js";
import { worker } from "../utils/worker";
import { WorkerConfig } from "../utils/types";
import crypto from "crypto"
import { URL } from "url";

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

interface PostRecord {
    username: string,
    post_id: symbol
}

export async function getTrackPoint(urls: string[]) {
    const workerUrls: Record<string, string> = {}

    urls.map(url => {
        const id = crypto.randomBytes(8).toString("hex")
        const parsedUrl = new URL(url)
        workerUrls[id] = `https://${parsedUrl.hostname}${parsedUrl.pathname}/embed/captioned/`
    })

    const extractPostID = async (args: Record<string, string>): Promise<string> => {
        const response = args.response
        const postIdSearch = response.match(/(?<=\"GraphVideo\\",\\"id\\":\\")\d+/gm)
        const userNameSearch = response.match(/(?<=user[?]username=).+?(?=[&])/)
        if (postIdSearch && userNameSearch) {
            const workerResponse = { username: userNameSearch[0], post_id: postIdSearch[0] }
            return JSON.stringify(workerResponse)
        }
        return ""
    }

    const workerConfig: WorkerConfig = { urls: workerUrls, resolverAction: extractPostID }
    const workerResponse = await worker(workerConfig)

    for (const key in workerResponse) {
        const postInfo = workerResponse[key]
        await registerTrackPoint(postInfo)
    }
}

async function registerTrackPoint(postInfoJson: string) {

    const info: PostRecord = JSON.parse(postInfoJson)

    const { data, error } = await db
        .from('post_history')
        .upsert(
            {
                username: info.username,
                post_id: info.post_id,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'username' }
        )
        .select();

    if (error) {
        console.error('Error performing upsert:', error);
        return null;
    }
}