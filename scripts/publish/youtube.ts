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
      text: description, // 📝 YouTube Video Description
      schedulingType: "automatic",
      mode: "shareNow",
      metadata: {
        youtube: {
          title: title,        // 📌 YouTube Video Title
          categoryId: "25",   // 📰 News & Politics
          madeForKids: false  // 🔞 Not Made for Kids
        }
      },
      assets: [
        {
          video: {
            url: url // Direct MP4 URL
          }
        }
      ]
    }
  };

  await publish({ payload: { query: publishQuery, variables: variables }, key: key })
}

export default initPublish