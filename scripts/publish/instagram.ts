
import { worker } from "../utils/worker"
import { WorkerConfig } from "../utils/types"



let getChannelIdRetries = 0
async function getChannelId(key: string) {
    const keys = process.env.Creds!
    console.log(keys);

    return
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
        service: string
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

        return channelInfo.data.channels[0].id
    } catch (error) {
        getChannelIdRetries++
        if (getChannelIdRetries === 3) {
            throw error
        }

        return await new Promise<any>((resolve) => {
            setTimeout(async () => {
                const result = await getChannelId(key)
                resolve(result)
            }, 3000);
        })
    }
}


async function publish(url: string) {




}

getChannelId("")