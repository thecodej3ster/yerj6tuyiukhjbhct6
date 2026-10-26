import { getChannelId } from "./utils/getChannelId"
import { publish } from "./utils/publish"

const publishQuery = `
mutation ShareNowYouTubePost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
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

async function initPublish({ url, key, description, title }: { url: string, description: string, key: string, title: string }) {
  const channelId = await getChannelId({ key: key, platform: "youtube" })

  const variables = {
    input: {
      channelId: channelId,
      text: description,
      schedulingType: "automatic",
      mode: "shareNow",
      metadata: {
        youtube: {
          title: title
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