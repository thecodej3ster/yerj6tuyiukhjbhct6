
import { getChannelId } from './utils/getChannelId'
import { publish } from './utils/publish'


const publishQuery = `
mutation ShareReelNow($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess {
      post {
        id
        status
      }
    }
    ... on MutationError {
      message
    }
  }
}
`

async function initPublish({ url, key, description }: { url: string, description: string, key: string }) {

    const channelId = await getChannelId({ key: key, platform: "instagram" })

    const variables = {
        input: {
            text: description,
            channelId: channelId,
            schedulingType: "automatic",
            mode: "shareNow",
            metadata: {
                instagram: {
                    type: "reel",
                    shouldShareToFeed: true
                }
            },
            assets: [
                {
                    video: {
                        url: url
                    }
                }
            ]
        }
    }

    await publish({ payload: { query: publishQuery, variables: variables }, key: key })
}

export default initPublish