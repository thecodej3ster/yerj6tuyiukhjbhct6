import { worker } from "../../utils/worker"
import { WorkerConfig } from "../../utils/types"
import { getDispatchPayload } from "./getDIspatchPayload"

let getChannelIdRetries = 0
async function getChannelId({ key, platform }: { key: string, platform: "instagram" | "youtube" }) {

    type OrganizationInfo = {
        data: {
            account: {
                organizations: [
                    {
                        id: string,
                        name: string
                    }
                ]
            }
        }
    }

    type Channel = {
        id: string,
        name: string,
        displayName: string,
        service: "instagram" | "youtube"
    }

    type ChannelInfo = {
        data: {
            channels: Channel[]
        }
    }

    const organizationsQuery = `
    query GetAccountAndChannels {
      account {
        organizations {
          id
          name
        }
      }
    }
  `
    const channelsQuery = `
        query GetChannels($organizationId: OrganizationId!) {
          channels(input: { organizationId: $organizationId }) {
            id
            name
            displayName
            service
          }
        }
      `
    const { username } = getDispatchPayload()

    try {
        let config: WorkerConfig = {
            urls: {
                organizations: "https://api.buffer.com"
            },
            requestConfig: {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key.trim()}`,
                },
                method: "POST",
                body: JSON.stringify({ query: organizationsQuery }),
                responseType: "json"
            }
        }

        const { organizations } = await worker(config) as { organizations: OrganizationInfo }

        config.urls = { channelInfo: "https://api.buffer.com" }
        if (config.requestConfig) {
            config.requestConfig.body = JSON.stringify({
                query: channelsQuery,
                variables: { organizationId: organizations.data.account.organizations[0].id }
            })
        }

        const { channelInfo } = await worker(config) as { channelInfo: ChannelInfo }
//  && username === info.name
        const channel = channelInfo.data.channels.filter(info => info.service === platform)

        return channel[0].id
    } catch (error) {
        getChannelIdRetries++
        if (getChannelIdRetries === 3) {
            throw error
        }

        return await new Promise<any>((resolve) => {
            setTimeout(async () => {
                const result = await getChannelId({ key: key, platform: platform })
                resolve(result)
            }, 3000);
        })
    }
}

export { getChannelId }