import { PostgrestError } from "@supabase/supabase-js";
import { worker } from "../utils/worker"
import { WorkerConfig, ResolverArgs } from "../utils/types";
import { createClient } from "@supabase/supabase-js";
import { submit } from "./submit";
import fs from 'fs'

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

interface PostRecord {
    username: string,
    post_id: string
}

interface WorkflowDispatchEvent {
    inputs: {
        campaignId: string;
    };
}

async function checkLatestPost({
    response: arg1,
    postId: arg2,
    username: arg3
}: ResolverArgs): Promise<Record<string, string> | null> {
    const response = arg1 as string
    const postId = arg2 as string
    const username = arg3 as string

    const pattern = new RegExp(/(?<=\"pk\":\")\d+(?=\",\"code":\")/g)
    const recentPostSearchMatch = response.match(pattern)

    let result: Record<string, string> | null = null
    let currentPost = postId

    if (recentPostSearchMatch) {
        const recentPosts: string[] = recentPostSearchMatch.filter(num => BigInt(num) > BigInt(postId))
        if (recentPosts.length) {
            recentPosts.reverse()
            const clipCodePattern = new RegExp(`(?<=${recentPosts[0]}\",\"code\":\")[^\"]+`)
            const clipCodeSearch = response.match(clipCodePattern)
            if (clipCodeSearch) {
                result = { url: `https://www.instagram.com/p/${clipCodeSearch[0]}/` }
            }
            currentPost = recentPosts[0]
        }
    }

    await db
        .from('post_history')
        .upsert(
            {
                username: username,
                post_id: currentPost,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'username' }
        )
    return result
}


export async function getRecentPost(): Promise<Record<string, boolean>> {

    const status = { sucess: false }
    const { data: lastPost, error }:
        { data: PostRecord | null, error: PostgrestError | null } = await db.from("post_history")
            .select("*")
            .order("updated_at", { ascending: true })
            .limit(1)
            .single()


    if (!lastPost) {
        return status
    }

    const workerConfig: WorkerConfig = {
        urls: { recentPost: `https://www.instagram.com/${lastPost.username}` },
        resolverArgs: { postId: lastPost.post_id, username: lastPost.username },
        resolverAction: checkLatestPost
    }

    const { recentPost } = await worker(workerConfig)

    console.log(recentPost);

    if (recentPost) {
        // recentPost.account_name = lastPost.username
        // recentPost.updated_at = new Date().toISOString()
        // await db.from("submission_queue").insert([recentPost])
        const eventPath = process.env.GITHUB_EVENT_PATH

        if (!eventPath) {
            throw new Error("GITHUB_EVENT_PATH environment variable is not set.");
        }

        const rawData = fs.readFileSync(eventPath, 'utf8');
        const { inputs }: WorkflowDispatchEvent = JSON.parse(rawData);

        const campaignId = inputs.campaignId

        console.log(campaignId);
        await submit({ campaignId: campaignId, url: recentPost.url })
        return { sucess: true }
    }
    return status
}

getRecentPost()