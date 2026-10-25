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

    videoIdSearchMatches

    const endIndex = videoIdSearchMatches.indexOf(lastSubmittedPost!)
    const unSubmittedPosts = videoIdSearchMatches.slice(0, endIndex)

    if (unSubmittedPosts.length) {
        const postToSubmit = unSubmittedPosts[unSubmittedPosts.length - 1]
        return postToSubmit
    }

    return null
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

    await db
        .from('track_points')
        .upsert(
            {
                post_id: postToSubmit,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'username' }
        )

    if (postToSubmit) {
        await submit({ campaignId: getCampaignId(), url: videoUrl })
    }
}

export default track