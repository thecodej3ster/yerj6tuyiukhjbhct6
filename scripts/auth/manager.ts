import { worker } from '../utils/worker'
import { WorkerConfig } from '../utils/types'

const p = {
    manager: {
        verdictmedia_1_instagram: 'buffer_access_token=A--2q9etQSD-kYOpdvFeaPln_lr6ytI3IcG3wlM9W61',
    }
}

const headers = {
    "Accept": 'application/graphql-response+json,application/json;q=0.9',
    "Content-Type": 'application/json',
    "Origin": 'https://publish.buffer.com',
    "Referer": 'https://publish.buffer.com/',
    "x-buffer-client-id": 'webapp-publishing',
    "x-buffer-client-name": 'webapp-publishing',
    "x-buffer-client-version": 'b905f56',
    "x-buffer-feature-flags": 'geid-publish-board-view=off,show-mocking-devtool=off,is-buffer-team=off,composer-get-post-graphql=off,home-blog-carousel=on,templates-refresh=on,publish-filters-revamp=off,geid-channel-agnostic-draft=on,geid-home-value-led-empty-state=ineligible,start-page-migration-wizard=off,insights-announcement-modal=on,public-graphql-api-modal=on,native-support-form=on,move-beacon-to-help-menu=off,geid-feature-specific-trial=off,geid-set-my-posting-schedule=on,channel-connection-permission-warning=off,geid-monthly-to-annual=ineligible,ig-login-refresh-banner=on,beacon-web-widget=on,geid-cet-dms-tab=off,geid-content-item-collaboration-notes=on,board-view-contents-query=off,apollo-retry-disabled=off'
}

const keys = process.env.Creds!
const tokens = JSON.parse(keys)
const auths = JSON.parse(process.env.Auth!)

async function generate() {
    const config: WorkerConfig = {
        urls: {
            authCreate: 'https://graph.buffer.com/?_o=generatePersonalAccessToken'
        },
        requestConfig: {
            headers: headers,
            method: "POST",
            responseType: "json",
            body: '{"operationName":"generatePersonalAccessToken","variables":{"input":{"scopes":["account:read","account:write","channels:write","notes:read","notes:write","posts:read","posts:write","ideas:read","ideas:write","snippets:read","snippets:write","insights:read","engagements:read","engagements:write"],"expiresIn":2592000}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation generatePersonalAccessToken($input: GeneratePersonalAccessTokenInput\u0021) {\\n  generatePersonalAccessToken(input: $input) {\\n    ... on GeneratePersonalAccessTokenSuccess {\\n      personalAccessToken {\\n        accessToken\\n        clientId\\n        name\\n        generatedAt\\n        expiresAt\\n        scopes\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}'
        }
    }
}

async function revoke() {
    const usernames = Object.keys(tokens)

    const config: WorkerConfig = {
        urls: {
            authRevoke: 'https://graph.buffer.com/?_o=revokePersonalAccessToken',
        },
        requestConfig: {
            headers: headers,
            method: "POST",
            responseType: "json",
        }
    }


    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        if (config.requestConfig) {
            config.requestConfig.body = `{"operationName":"revokePersonalAccessToken","variables":{"input":{"accessToken":"${tokens[username]}"}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation revokePersonalAccessToken($input: RevokePersonalAccessTokenInput\u0021) {\\n  revokePersonalAccessToken(input: $input) {\\n    ... on RevokePersonalAccessTokenSuccess {\\n      active\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`
            if (config.requestConfig.headers) {
                config.requestConfig.headers["Cookies"] = auths["manager"][username]
            }
        }

<<<<<<< HEAD



        const { authRevoke } = await worker(config)

        console.log(authRevoke);


=======
        const { authRevoke } = await worker(config)
        console.log(authRevoke)
>>>>>>> dev
    }

}

async function auth() {
    await revoke()
}

export default auth