import { worker } from '../utils/worker'
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { save } from './utils/save'

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

const keys = process.env.Creds!
const tokens = JSON.parse(keys)
const auths = JSON.parse(process.env.Auths!)
const usernames = Object.keys(tokens)
const authUrls: Record<string, string> = {}
const authSessionUrls: Record<string, string> = {}

async function auth() {

    const cookieStore: Record<string, Record<string, string>> = {}

    const setCookie = (username: string, cookies: string[]) => {
        cookies.map(cookie => {
            const cookieParts = cookie.split(";")
            const parsedCokie = cookieParts[0].replace("=", ';').split(";")
            if (cookieStore[username] === undefined) {
                cookieStore[username] = {}
            }
            cookieStore[username][parsedCokie[0]] = parsedCokie[1]
        })
    }

    const saveCookie = async ({ headers, username }: ResolverArgs & { username?: string }) => {
        const cookies = headers["set-cookie"] as string[]
        if (username) {
            setCookie(username, cookies)
        }
        console.log(headers);
        
        return headers.location
    }

    const getAuthUrlConfig: WorkerConfig = {
        urls: {
            authUrl: 'https://callbacks.buffer.com/auth/oidc/authorize'
        },
        requestConfig: {
            headers: {},
            maxRedirects: 0,
            validateStatus: (status) => status < 400 && status > 199
        },
        resolverAction: saveCookie,
        resolverArgs: {}
    }

    let getAuthUrlWorkIndex = 0
    const runGetAuthUrl = async () => {
        const username = usernames[getAuthUrlWorkIndex]

        if (!getAuthUrlConfig.requestConfig || getAuthUrlConfig.resolverArgs === undefined || getAuthUrlConfig.requestConfig.headers === undefined) return
        let cookie = auths.manager[username] + ";"

        for (const cookieName in cookieStore[username]) {
            cookie += `${cookieName}=${cookieStore[username][cookieName]};`
        }

        getAuthUrlConfig.requestConfig.headers.Cookie = cookie
        getAuthUrlConfig.resolverArgs.username = username

        const { authUrl } = await worker(getAuthUrlConfig) as { authUrl: string }
        if (!authUrl.toLowerCase().startsWith("http")) {
            throw new Error("Invalid Url Recived");
        }
        authUrls[username] = authUrl
return

        getAuthUrlWorkIndex++
        if (getAuthUrlWorkIndex === usernames.length) {
            return
        }
        runGetAuthUrl()
    }

    const getAuthSessionUrlConfig: WorkerConfig = {
        urls: {},
        requestConfig: {
            headers: {},
            maxRedirects: 0,
            validateStatus: (status) => status < 400 && status > 199
        },
        resolverAction: saveCookie,
        resolverArgs: {}
    }

    let getAuthSessionUrlWorkIndex = 0
    const runGetAuthSessionUrl = async () => {
        const username = usernames[getAuthSessionUrlWorkIndex]


        if (!getAuthSessionUrlConfig.requestConfig || getAuthSessionUrlConfig.resolverArgs === undefined || getAuthSessionUrlConfig.requestConfig.headers === undefined || getAuthSessionUrlConfig.urls === undefined) return

        getAuthSessionUrlConfig.urls.authSessionUrl = authUrls[username]

        let cookie = auths.manager[username] + ";"

        for (const cookieName in cookieStore[username]) {
            cookie += `${cookieName}=${cookieStore[username][cookieName]};`
        }

        getAuthSessionUrlConfig.requestConfig.headers.Cookie = cookie
        getAuthSessionUrlConfig.resolverArgs.username = username

        if (getAuthSessionUrlConfig.urls.authSessionUrl) {
            const { authSessionUrl } = await worker(getAuthSessionUrlConfig) as { authSessionUrl: string }

            authSessionUrls[username] = authSessionUrl
        }

return
        getAuthSessionUrlWorkIndex++
        if (getAuthSessionUrlWorkIndex === usernames.length) {
            return
        }
        runGetAuthSessionUrl()
    }


    const getAuthTokenConfig: WorkerConfig = {
        urls: {},
        requestConfig: {
            headers: {},
            maxRedirects: 0,
            validateStatus: (status) => status < 400 && status > 199
        },
        resolverAction: saveCookie,
        resolverArgs: {}
    }

    let getAuthTokenWorkIndex = 0
    const runGetAuthToken = async () => {
        const username = usernames[getAuthTokenWorkIndex]
        console.log(authSessionUrls);

        if (!getAuthTokenConfig.requestConfig || getAuthTokenConfig.resolverArgs === undefined || getAuthTokenConfig.requestConfig.headers === undefined || getAuthTokenConfig.urls === undefined) return

        getAuthTokenConfig.urls.authToken = authSessionUrls[username]

        let cookie = auths.manager[username] + ";"

        for (const cookieName in cookieStore[username]) {
            cookie += `${cookieName}=${cookieStore[username][cookieName]};`
        }

        getAuthTokenConfig.requestConfig.headers.Cookie = cookie
        getAuthTokenConfig.resolverArgs.username = username

        if (getAuthTokenConfig.urls.authToken) {
            await worker(getAuthTokenConfig) as { authToken: string }

        }
        return


        getAuthTokenWorkIndex++
        if (getAuthTokenWorkIndex === usernames.length) {
            return
        }
        runGetAuthToken()
    }



    const createAccesssTokenConfig: WorkerConfig = {
        urls: {
            authCreate: 'https://graph.buffer.com/?_o=generatePersonalAccessToken'
        },
        requestConfig: {
            headers: commonHeaders,
            method: "POST",
            responseType: "json",
            body: '{"operationName":"generatePersonalAccessToken","variables":{"input":{"scopes":["account:read","account:write","channels:write","notes:read","notes:write","posts:read","posts:write","ideas:read","ideas:write","snippets:read","snippets:write","insights:read","engagements:read","engagements:write"],"expiresIn":2592000}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation generatePersonalAccessToken($input: GeneratePersonalAccessTokenInput\u0021) {\\n  generatePersonalAccessToken(input: $input) {\\n    ... on GeneratePersonalAccessTokenSuccess {\\n      personalAccessToken {\\n        accessToken\\n        clientId\\n        name\\n        generatedAt\\n        expiresAt\\n        scopes\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}'
        }
    }

    let createAccesssTokenWorkIndex = 0
    async function createAccesssToken() {
        const username = usernames[createAccesssTokenWorkIndex]

        if (!revokeAuthTokenConfig.requestConfig || revokeAuthTokenConfig.requestConfig.headers === undefined) return

        let cookie = auths.manager[username] + ";"

        for (const cookieName in cookieStore[username]) {
            cookie += `${cookieName}=${cookieStore[username][cookieName]};`
        }

        revokeAuthTokenConfig.requestConfig.headers.Cookie = cookie

        const { authCreate } = await worker(createAccesssTokenConfig) as {
            authCreate: { data?: { generatePersonalAccessToken?: { personalAccessToken?: { accessToken?: string } } } }
        }
        console.log(authCreate);

        const accessToken = authCreate?.data?.generatePersonalAccessToken?.personalAccessToken?.accessToken

        if (!accessToken) {
            throw new Error("UNEXPECTED VALUE PASSED AS ACCESS TOKEN");
        }

        tokens[username] = accessToken
        await save({ name: 'CREDS', value: JSON.stringify(tokens) })

        createAccesssTokenWorkIndex++
        if (createAccesssTokenWorkIndex === usernames.length) {
            return
        }
        createAccesssToken()
    }

    const revokeAuthTokenConfig: WorkerConfig = {
        urls: {
            authRevoke: 'https://graph.buffer.com/?_o=revokePersonalAccessToken',
        },
        requestConfig: {
            headers: commonHeaders,
            method: "POST",
            responseType: "json",
        }
    }


    let revokeWorkIndex = 0
    async function revokeAccesssToken() {
        const username = usernames[revokeWorkIndex]

        if (!revokeAuthTokenConfig.requestConfig || revokeAuthTokenConfig.requestConfig.headers === undefined) return

        revokeAuthTokenConfig.requestConfig.body = `{"operationName":"revokePersonalAccessToken","variables":{"input":{"accessToken":"${tokens[username]}"}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation revokePersonalAccessToken($input: RevokePersonalAccessTokenInput\u0021) {\\n  revokePersonalAccessToken(input: $input) {\\n    ... on RevokePersonalAccessTokenSuccess {\\n      active\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`

        let cookie = auths.manager[username] + ";"

        for (const cookieName in cookieStore[username]) {
            cookie += `${cookieName}=${cookieStore[username][cookieName]};`
        }

        revokeAuthTokenConfig.requestConfig.headers.Cookie = cookie

        const { authRevoke } = await worker(revokeAuthTokenConfig)
        console.log(authRevoke);

        revokeWorkIndex++
        if (revokeWorkIndex === usernames.length) {
            return
        }
        revokeAccesssToken()
    }

    // await runGetAuthUrl()
    // console.log(cookieStore);
    // await runGetAuthSessionUrl()
    // console.log(cookieStore);
    // await runGetAuthToken()
    // console.log(cookieStore);

    await processPipeline([
        runGetAuthUrl,
        runGetAuthSessionUrl,
        runGetAuthToken
    ])
    // await revokeAccesssToken()
    // await createAccesssToken()

}

let index = 0
let delay = 5000
async function processPipeline(steps: (() => Promise<void>)[]) {
    const step = steps[index]

    try {
        await step()
        index++
        if (index === steps.length) {
            return
        }

        await processPipeline(steps)
        console.log(cookieStore);
        
    } catch (error) {
        if (delay > 30000) {
            throw new Error("Could Not Complete Pipeline Processign");
        }

        await new Promise<void>((resolve) => {
            setTimeout(async () => {
                delay += 5000
                await processPipeline(steps)
                resolve()
            }, delay);
        })
    }
}

export default auth