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

const description = `
This video is shared for commentary, entertainment, and informational purposes. It features content from the original creator and is intended to highlight interesting moments, discussions, and perspectives.
Disclaimer: This is an independent, unofficial channel and is not affiliated with, endorsed by, or operated by the original creator. All original content belongs to its respective owners. Credit belongs to the original creator.
Our goal is to present engaging moments in a concise format for viewers to enjoy and discover the original content.
For original content, please visit the creator's official channels.
If you are the rights holder and have any concerns regarding the use of your content, please contact us.
#debate #politics #shorts
  `

async function initPublish({ url, key, title }: { url: string, key: string, title: string }) {
  const channelId = await getChannelId({ key: key, platform: "youtube" })

  const variables = {
    input: {
      channelId: channelId,
      text: description,
      schedulingType: "automatic",
      mode: "shareNow",
      metadata: {
        youtube: {
          title: title,
          categoryId: "25",
          madeForKids: false
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
  };

  await publish({ payload: { query: publishQuery, variables: variables }, key: key })
}

export default initPublish