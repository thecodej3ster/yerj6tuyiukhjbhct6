import { worker } from '../../utils/worker'
import { WorkerConfig, ResolverArgs } from '../../utils/types'
import { submit } from '..'
import { createClient } from "@supabase/supabase-js";
import { PostRecord } from './types';
import { getCampaignId } from './helpers';


async function extractVideoID({ response: arg1, lastSubmittedPost }: ResolverArgs & { lastSubmittedPost?: string }) {
    const response = arg1 as string
    const videoIdSearchMatches = response.match(/[^-'"]{11}(?=","accessibilityText"[:])/mg)

    if (!videoIdSearchMatches) {
        throw new Error("No Video Id Found");
    }


    const endIndex = videoIdSearchMatches.indexOf(lastSubmittedPost!)
    const unSubmittedPosts = videoIdSearchMatches.slice(0, endIndex)

    if (unSubmittedPosts.length) {
        const postToSubmit = unSubmittedPosts[unSubmittedPosts.length - 1]
        return postToSubmit
    }

    return lastSubmittedPost
}

async function track(lastSubmittedPost: PostRecord) {

    const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
    const config: WorkerConfig = {
        urls: {
            postToSubmit: `https://www.youtube.com/@${lastSubmittedPost.username}/shorts`
        },
        resolverAction: extractVideoID,
        resolverArgs: { lastSubmittedPost: lastSubmittedPost.post_id }
    }

    const { postToSubmit } = await worker(config) as { postToSubmit: string }

    const videoUrl = `https://www.youtube.com/watch?v=${postToSubmit}`

    if (/\d\d{5,}(?=\d{5,})/.test(postToSubmit) && postToSubmit !== lastSubmittedPost.post_id) {
        await submit({ campaignId: getCampaignId(), url: videoUrl })

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
}

export default track