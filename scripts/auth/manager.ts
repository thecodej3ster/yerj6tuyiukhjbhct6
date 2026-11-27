import { worker } from '../utils/worker'
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { CookieStore } from '../utils/cookie'

let keys = process.env.Creds!
const tokens = JSON.parse(keys)
const auths = JSON.parse(process.env.Auths!)
const authGroups: Record<string, string[]> = {}
let personalAccessTokens: { [username: string]: { accessToken?: string | undefined }[] } = {}
let usernames: string[] = []


const commonHeaders = {
    "Accept": 'application/graphql-response+json,application/json;q=0.9',
    "Content-Type": 'application/json',
    "Origin": 'https://publish.buffer.com',
    "Referer": 'https://publish.buffer.com/',
    "x-buffer-client-id": 'webapp-publishing',
    "x-buffer-client-name": 'webapp-publishing',
    "x-buffer-client-version": 'b905f56',
    "x-buffer-feature-flags": 'geid-publish-board-view=off,show-mocking-devtool=off,is-buffer-team=off,composer-get-post-graphql=off,home-blog-carousel=on,templates-refresh=on,publish-filters-revamp=off,geid-channel-agnostic-draft=on,geid-home-value-led-empty-state=ineligible,start-page-migration-wizard=off,insights-announcement-modal=on,public-graphql-api-modal=on,native-support-form=on,move-beacon-to-help-menu=off,geid-feature-specific-trial=off,geid-set-my-posting-schedule=on,channel-connection-permission-warning=off,geid-monthly-to-annual=ineligible,ig-login-refresh-banner=on,beacon-web-widget=on,geid-cet-dms-tab=off,geid-content-item-collaboration-notes=on,board-view-contents-query=off,apollo-retry-disabled=off'
}

const getAuthTokenConfig: WorkerConfig = {
    urls: {},
    requestConfig: {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        },
        maxRedirects: 2
    },
    resolverAction: async ({ key, url }: ResolverArgs) => {
        const cookieStore = new CookieStore({ storeId: key, url: url })
        const cookies = cookieStore.get({ parse: true })

        if (!cookies || !Object.keys(cookies).includes("buffer_access_token")) {
            throw new Error("Access Token Not Found");
        }
    }

}

const revokeAuthTokenConfig: WorkerConfig = {
    urls: {},
    requestConfig: {
        headers: commonHeaders,
        method: "POST",
        responseType: "json",
    }
}


const getAccessTokensConfig: WorkerConfig = {
    urls: {},
    requestConfig: {
        headers: commonHeaders,
        method: "POST",
        responseType: "json",
        body: "{\"operationName\":\"getPersonalAccessTokens\",\"variables\":{},\"extensions\":{\"clientLibrary\":{\"name\":\"@apollo/client\",\"version\":\"4.2.6\"}},\"query\":\"query getPersonalAccessTokens {\\n  personalAccessTokens {\\n    accessTokens {\\n      accessToken\\n      clientId\\n      name\\n      generatedAt\\n      expiresAt\\n      scopes\\n      __typename\\n    }\\n    maxTokens\\n    __typename\\n  }\\n}\"}"
    }
}

const createAccesssTokenConfig: WorkerConfig = {
    urls: {},
    requestConfig: {
        headers: commonHeaders,
        method: "POST",
        responseType: "json",
        body: '{"operationName":"generatePersonalAccessToken","variables":{"input":{"scopes":["account:read","account:write","channels:write","notes:read","notes:write","posts:read","posts:write","ideas:read","ideas:write","snippets:read","snippets:write","insights:read","engagements:read","engagements:write"],"expiresIn":2592000}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation generatePersonalAccessToken($input: GeneratePersonalAccessTokenInput\u0021) {\\n  generatePersonalAccessToken(input: $input) {\\n    ... on GeneratePersonalAccessTokenSuccess {\\n      personalAccessToken {\\n        accessToken\\n        clientId\\n        name\\n        generatedAt\\n        expiresAt\\n        scopes\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}'
    }
}

function sortAuth() {
    for (const username in auths.manager) {
        const token: string = auths.manager[username]

        if (!authGroups[token]) {
            authGroups[token] = []
        }
        authGroups[token].push(username)
    }
}


async function hydrateCookieStore() {
    for (const auth in authGroups) {
        const username = authGroups[auth][0]
        const cookie = `${auth};domain=.buffer.com;path=/`
        usernames.push(username)
        const cookieStore = new CookieStore({ storeId: username, url: 'https://buffer.com/' })
        cookieStore.set([cookie])
    }
}

async function createAccesssToken() {
    console.log('CREATING ACCESS TOKEN ...');

    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];

        createAccesssTokenConfig.urls[username] = 'https://graph.buffer.com/?_o=generatePersonalAccessToken'
        console.log(createAccesssTokenConfig);

        const authCreate = await worker(createAccesssTokenConfig) as {
            [username: string]: { data?: { generatePersonalAccessToken?: { personalAccessToken?: { accessToken?: string } } } }
        }

        const accessToken = authCreate[username].data?.generatePersonalAccessToken?.personalAccessToken?.accessToken

        if (!accessToken) {
            console.log(authCreate);
            throw new Error("UNEXPECTED VALUE Recived AS ACCESS TOKEN");
        }

        keys = keys.replaceAll(tokens[username], accessToken)
    }
}


let revokeWorkIndex = 0

async function revokeAccesssToken({ accessToken, user }: { accessToken?: string, user?: string }) {
    const username = user || usernames[revokeWorkIndex]
    const token = accessToken || tokens[username]

    if (!revokeAuthTokenConfig.requestConfig) return

    revokeAuthTokenConfig.requestConfig.body = `{"operationName":"revokePersonalAccessToken","variables":{"input":{"accessToken":"${token}"}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation revokePersonalAccessToken($input: RevokePersonalAccessTokenInput\u0021) {\\n  revokePersonalAccessToken(input: $input) {\\n    ... on RevokePersonalAccessTokenSuccess {\\n      active\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`
    revokeAuthTokenConfig.urls[username] = 'https://graph.buffer.com/?_o=revokePersonalAccessToken'
    console.log(revokeAuthTokenConfig);

    const authRevoke = await worker(revokeAuthTokenConfig)
    console.log(authRevoke[username]);

    if (accessToken && user) {
        return
    }
    revokeWorkIndex++
    if (revokeWorkIndex === usernames.length) {
        return
    }
    await revokeAccesssToken({})
}

async function getAccessTokens() {
    console.log('GETTING ACCESS TOKEN ...')

    type AccessToken = {
        data?: {
            personalAccessTokens?: {
                accessTokens?: {
                    accessToken?: string
                }[]
            }
        }, error?: {}
    }

    const tokens: { [username: string]: { accessToken?: string | undefined }[] } = {}

    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i]
        if (getAccessTokensConfig.urls) {
            getAccessTokensConfig.urls[username] = 'https://graph.buffer.com/?_o=getPersonalAccessTokens'
        }
    }

    const response = await worker(getAccessTokensConfig)

    console.log(response);
    
    for (const username in response) {
        const accessTokens: AccessToken = response[username]
        const personalAccessTokens = accessTokens.data?.personalAccessTokens?.accessTokens

        if (personalAccessTokens && personalAccessTokens.length) {
            tokens[username] = personalAccessTokens
        } else {
            tokens[username] = []
        }

        if (accessTokens?.error) {
            throw accessTokens?.error
        }
    }

    return tokens
}

async function revokeAllAccessTokens() {
    console.log('REVOKING ACCESS TOKEN ...');

    for (let j = 0; j < usernames.length; j++) {
        const username = usernames[j];
        const accessTokens: { accessToken?: string }[] = personalAccessTokens[username]

        if (accessTokens) {
            for (let i = 0; i < accessTokens.length; i++) {
                const { accessToken } = accessTokens[i];
                await revokeAccesssToken({ accessToken: accessToken, user: username })
            }
        }
    }
}

async function runGetAuthToken() {
    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i]
        if (getAuthTokenConfig.urls) {
            getAuthTokenConfig.urls[username] = 'https://callbacks.buffer.com/auth/oidc/authorize'
        }
    }

    await worker(getAuthTokenConfig)
}


async function auth() {
    sortAuth()
    hydrateCookieStore()
    await runGetAuthToken()
    await getAccessTokens()
    console.log(personalAccessTokens);
    
    // await revokeAllAccessTokens()
    // await createAccesssToken()
    console.log('MANAGER AUTH PIPELINE SUCESSFULLY EXECUTED');
}

export default auth