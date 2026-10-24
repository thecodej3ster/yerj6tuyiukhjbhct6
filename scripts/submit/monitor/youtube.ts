import { worker } from '../../utils/worker'
import { WorkerConfig, ResolverArgs } from '../../utils/types'


async function extractVideoIDs({ response }: ResolverArgs) {
    const data = response as string
    const videoIdSearchMatches = data.match(/[^-'"]{11}(?=","accessibilityText"[:])/mg)

    if (!videoIdSearchMatches) {
        throw new Error("No Video Id Found");        
    }

    const videoIds = videoIdSearchMatches

    return videoIds
}

async function track() {
    const username = "BelmarDivision"

    const config: WorkerConfig = {
        urls: {
            videoIds: `https://www.youtube.com/@${username}/shorts`
        },
        resolverAction: extractVideoIDs
    }

    const videoIds = await worker(config)

    console.log(videoIds);
    
}

track()