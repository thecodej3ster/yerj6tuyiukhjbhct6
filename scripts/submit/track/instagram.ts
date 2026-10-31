import { createClient } from "@supabase/supabase-js";
import { worker } from "../../utils/worker"
import { WorkerConfig, ResolverArgs } from "../../utils/types";
import { submit } from "../index";
import { getCampaignId } from "./helpers";
import { PostRecord } from "./types";

async function getPostId({ response: arg1, lastSubmittedPost: arg2 }: ResolverArgs & { lastSubmittedPost?: string }) {
    const response = arg1 as string
    const lastSubmittedPost = arg2 as string

    const pattern = new RegExp('(?<=\"pk\":\")\d+(?=\",\"code":\")', 'g')
    const recentPostSearchMatch = response.match(pattern)
    let postId = lastSubmittedPost

    if (recentPostSearchMatch) {
        const recentPosts: string[] = recentPostSearchMatch.filter(num => BigInt(num) > BigInt(lastSubmittedPost))

        if (recentPosts.length) {
            recentPosts.reverse()
            postId = recentPosts[0]
        }
    }
    const clipCodePattern = new RegExp(`(?<=${postId}\",\"code\":\")[^\"]+`)
    const clipCodeSearch = response.match(clipCodePattern)
    if (!clipCodeSearch) {
        throw new Error("Clip Code Not Found");
    }
    return { postToSubmit: postId, code: clipCodeSearch[0] }
}


async function track(lastSubmittedPost: PostRecord) {
    const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

    const workerConfig: WorkerConfig = {
        urls: { post: `https://www.instagram.com/${lastSubmittedPost.username}` },
        resolverArgs: { lastSubmittedPost: lastSubmittedPost.post_id },
        resolverAction: getPostId
    }


    const { post } = await worker(workerConfig) as { post: { code: string, postToSubmit: string } }
    const { code, postToSubmit } = post

    if (/\d\d{5,}(?=\d{5,})/.test(postToSubmit)) {
        console.log('yESSSSSSSSSSSSSSSSSSSSSSS');
        
    }
    if (/\d\d{5,}(?=\d{5,})/.test(postToSubmit) && postToSubmit !== lastSubmittedPost.post_id) {
        console.log('hi');
        console.log(postToSubmit);

        const videoUrl = `https://www.instagram.com/p/${code}/`
        await submit({ campaignId: getCampaignId(), url: videoUrl })
    }

    const { error } = await db
        .from('track_points')
        .upsert(
            {
                username: lastSubmittedPost.username,
                platform: lastSubmittedPost.platform,
                post_id: postToSubmit,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'username,platform' }
        )

    if (error) {
        console.log(error)
        throw error
    }
}

export default track