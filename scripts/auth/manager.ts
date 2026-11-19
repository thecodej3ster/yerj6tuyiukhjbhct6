import { worker } from '../utils/worker'
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { CookieStore } from '../utils/cookie'
import { save } from './utils/save'
import { access } from 'fs'


let keys = process.env.Creds!
const tokens = JSON.parse(keys)
const auths = JSON.parse(process.env.Auths!)
const authUrls: Record<string, string> = {}
const authSessionUrls: Record<string, string> = {}
const authGroups: Record<string, string[]> = {}
let cookieStore: CookieStore
let delay = 0
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

const getAuthUrlConfig: WorkerConfig = {
    urls: {},
    requestConfig: {
        headers: {},
        maxRedirects: 2,
        validateStatus: (status) => status < 400 && status > 199,
    },
    resolverArgs: {}
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

const getAccessTokensConfig: WorkerConfig = {
    urls: { accessTokens: 'https://graph.buffer.com/?_o=getPersonalAccessTokens' },
    requestConfig: {
        headers: commonHeaders,
        method: "POST",
        responseType: "json",
        body: "{\"operationName\":\"getPersonalAccessTokens\",\"variables\":{},\"extensions\":{\"clientLibrary\":{\"name\":\"@apollo/client\",\"version\":\"4.2.6\"}},\"query\":\"query getPersonalAccessTokens {\\n  personalAccessTokens {\\n    accessTokens {\\n      accessToken\\n      clientId\\n      name\\n      generatedAt\\n      expiresAt\\n      scopes\\n      __typename\\n    }\\n    maxTokens\\n    __typename\\n  }\\n}\"}"
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



// function setCookie(username: string, cookies: string[]) {
//     cookies.map(cookie => {
//         const cookieParts = cookie.split(";")
//         const parsedCokie = cookieParts[0].replace("=", ';').split(";")
//         if (cookieStore[username] === undefined) {
//             cookieStore[username] = {}
//         }
//         cookieStore[username][parsedCokie[0]] = parsedCokie[1]
//     })
// }

async function saveCookie({ headers, username, response }: ResolverArgs & { username?: string }) {
    const data = response as string
    const cookies = headers["set-cookie"] as string[]
    const foundRedirect = data.match(/(?<=Found. Redirecting to )[^<]+/m)
    // if (!cookies) {
    //     const foundRedirect = data.match(/(?<=Found. Redirecting to )[^<]+/m)
    //     if (foundRedirect) {
    //         return foundRedirect[0]
    //     }

    // }
    // if (username) {
    //     setCookie(username, cookies)
    // }
    // if (!cookies || !foundRedirect) {
    //     throw new Error("AuthUrl Not Found");
    // }
    // return headers.location
}

async function hydrateCookieStore() {
    for (const auth in authGroups) {
        const username = authGroups[auth][0]
        cookieStore = new CookieStore({ storeId: username, url: 'https://buffer.com/' })
        cookieStore.set([auth])
        // const [name, value] = auth.split('=')
        // cookieStore[username] = {}
        // cookieStore[username][name] = value
    }
}



let getAuthUrlWorkIndex = 0
async function runGetAuthUrl() {
    const username = usernames[getAuthUrlWorkIndex]

    if (getAuthUrlConfig.urls) {
        getAuthUrlConfig.urls[username] = 'https://callbacks.buffer.com/auth/oidc/authorize'
    }

    // if (!getAuthUrlConfig.requestConfig || getAuthUrlConfig.resolverArgs === undefined || getAuthUrlConfig.requestConfig.headers === undefined) return
    // let cookie = ""

    // for (const cookieName in cookieStore[username]) {
    //     cookie += `${cookieName}=${cookieStore[username][cookieName]};`
    // }

    // getAuthUrlConfig.requestConfig.headers.Cookie = cookie
    // getAuthUrlConfig.resolverArgs.username = username

    const response = await worker(getAuthUrlConfig)
    const authUrl = response[username]
    console.log(cookieStore.get({}))


    try {

        // if (!authUrl.toLowerCase().startsWith("http")) {
        //     throw new Error("Invalid Url Recived");
        // }
        // authUrls[username] = authUrl
        // getAuthUrlWorkIndex++
        // delay = 0

        // if (getAuthUrlWorkIndex === usernames.length) {
        //     return
        // }

        // await runGetAuthUrl()
    } catch (error) {
        delay += 5000
        if (delay === 30000) {
            throw error
        }

        await new Promise<void>((resolve) => {
            setTimeout(async () => {
                await runGetAuthUrl()
                resolve()
            }, delay);
        })
    }
}



// let getAuthSessionUrlWorkIndex = 0
// const runGetAuthSessionUrl = async () => {

//     const username = usernames[getAuthSessionUrlWorkIndex]

//     if (!getAuthSessionUrlConfig.requestConfig || getAuthSessionUrlConfig.resolverArgs === undefined || getAuthSessionUrlConfig.requestConfig.headers === undefined || getAuthSessionUrlConfig.urls === undefined) return

//     getAuthSessionUrlConfig.urls.authSessionUrl = authUrls[username]

//     let cookie = ""

//     for (const cookieName in cookieStore[username]) {
//         cookie += `${cookieName}=${cookieStore[username][cookieName]};`
//     }

//     getAuthSessionUrlConfig.requestConfig.headers.Cookie = cookie
//     getAuthSessionUrlConfig.resolverArgs.username = username

//     if (getAuthSessionUrlConfig.urls.authSessionUrl) {
//         const { authSessionUrl } = await worker(getAuthSessionUrlConfig) as { authSessionUrl: string }
//         authSessionUrls[username] = authSessionUrl
//     }

//     getAuthSessionUrlWorkIndex++
//     delay = 0
//     if (getAuthSessionUrlWorkIndex === usernames.length) {
//         return
//     }
//     await runGetAuthSessionUrl()

// }


// let getAuthTokenWorkIndex = 0
// const runGetAuthToken = async () => {
//     const username = usernames[getAuthTokenWorkIndex]

//     if (!getAuthTokenConfig.requestConfig || getAuthTokenConfig.resolverArgs === undefined || getAuthTokenConfig.requestConfig.headers === undefined || getAuthTokenConfig.urls === undefined) return

//     getAuthTokenConfig.urls.authToken = authSessionUrls[username]

//     let cookie = ""

//     for (const cookieName in cookieStore[username]) {
//         cookie += `${cookieName}=${cookieStore[username][cookieName]};`
//     }

//     getAuthTokenConfig.requestConfig.headers.Cookie = cookie
//     getAuthTokenConfig.resolverArgs.username = username

//     if (getAuthTokenConfig.urls.authToken) {
//         await worker(getAuthTokenConfig) as { authToken: string }

//     }

//     getAuthTokenWorkIndex++
//     delay = 0
//     if (getAuthTokenWorkIndex === usernames.length) {
//         return
//     }

//     await runGetAuthToken()
// }



// const createAccesssTokenConfig: WorkerConfig = {
//     urls: {
//         authCreate: 'https://graph.buffer.com/?_o=generatePersonalAccessToken'
//     },
//     requestConfig: {
//         headers: commonHeaders,
//         method: "POST",
//         responseType: "json",
//         body: '{"operationName":"generatePersonalAccessToken","variables":{"input":{"scopes":["account:read","account:write","channels:write","notes:read","notes:write","posts:read","posts:write","ideas:read","ideas:write","snippets:read","snippets:write","insights:read","engagements:read","engagements:write"],"expiresIn":2592000}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation generatePersonalAccessToken($input: GeneratePersonalAccessTokenInput\u0021) {\\n  generatePersonalAccessToken(input: $input) {\\n    ... on GeneratePersonalAccessTokenSuccess {\\n      personalAccessToken {\\n        accessToken\\n        clientId\\n        name\\n        generatedAt\\n        expiresAt\\n        scopes\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}'
//     }
// }

// let createAccesssTokenWorkIndex = 0
// async function createAccesssToken() {
//     const username = usernames[createAccesssTokenWorkIndex]

//     if (!revokeAuthTokenConfig.requestConfig || revokeAuthTokenConfig.requestConfig.headers === undefined) return

//     let cookie = ""

//     for (const cookieName in cookieStore[username]) {
//         cookie += `${cookieName}=${cookieStore[username][cookieName]};`
//     }

//     revokeAuthTokenConfig.requestConfig.headers.Cookie = cookie

//     const { authCreate } = await worker(createAccesssTokenConfig) as {
//         authCreate: { data?: { generatePersonalAccessToken?: { personalAccessToken?: { accessToken?: string } } } }
//     }
//     console.log(authCreate);

//     const accessToken = authCreate?.data?.generatePersonalAccessToken?.personalAccessToken?.accessToken

//     if (!accessToken) {
//         throw new Error("UNEXPECTED VALUE PASSED AS ACCESS TOKEN");
//     }

//     keys = keys.replaceAll(tokens[username], accessToken)

//     createAccesssTokenWorkIndex++
//     if (createAccesssTokenWorkIndex === usernames.length) {
//         return
//     }
//     await createAccesssToken()
// }



// let revokeWorkIndex = 0
// async function revokeAccesssToken({ accessToken, user }: { accessToken?: string, user?: string }) {
//     const username = user || usernames[revokeWorkIndex]

//     if (!revokeAuthTokenConfig.requestConfig || revokeAuthTokenConfig.requestConfig.headers === undefined) return

//     const token = accessToken || tokens[username]
//     revokeAuthTokenConfig.requestConfig.body = `{"operationName":"revokePersonalAccessToken","variables":{"input":{"accessToken":"${token}"}},"extensions":{"clientLibrary":{"name":"@apollo/client","version":"4.2.6"}},"query":"mutation revokePersonalAccessToken($input: RevokePersonalAccessTokenInput\u0021) {\\n  revokePersonalAccessToken(input: $input) {\\n    ... on RevokePersonalAccessTokenSuccess {\\n      active\\n      __typename\\n    }\\n    ... on InvalidInputError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`

//     let cookie = ""

//     for (const cookieName in cookieStore[username]) {
//         cookie += `${cookieName}=${cookieStore[username][cookieName]};`
//     }

//     revokeAuthTokenConfig.requestConfig.headers.Cookie = cookie

//     const { authRevoke } = await worker(revokeAuthTokenConfig)
//     console.log(authRevoke);

//     if (accessToken && user) {
//         return
//     }
//     revokeWorkIndex++
//     if (revokeWorkIndex === usernames.length) {
//         return
//     }
//     await revokeAccesssToken({})
// }


// async function getAccessTokens(username: string) {
//     if (!getAccessTokensConfig.requestConfig || getAccessTokensConfig.requestConfig.headers === undefined) return

//     let cookie = ""

//     for (const cookieName in cookieStore[username]) {
//         cookie += `${cookieName}=${cookieStore[username][cookieName]};`
//     }

//     getAccessTokensConfig.requestConfig.headers.Cookie = cookie

//     const { accessTokens } = await worker(getAccessTokensConfig) as { accessTokens: { data?: { personalAccessTokens?: { accessTokens?: { accessToken?: string }[] } }, error?: {} } }

//     const personalAccessTokens = accessTokens?.data?.personalAccessTokens?.accessTokens
//     if (personalAccessTokens) {
//         if (personalAccessTokens.length) {
//             return personalAccessTokens
//         } else {
//             return []
//         }
//     }

//     if (accessTokens?.error) {
//         throw accessTokens?.error
//     }
//     console.log(accessTokens);

// }

// let revokeAllAccessTokensWorkIndex = 0

// async function r'https://publish.buffer.com'evokeAllAccessTokens() {
//     const username = usernames[revokeAllAccessTokensWorkIndex]
//     const accessTokens = await getAccessTokens(username) as { accessToken?: string }[]

//     for (let i = 0; i < accessTokens.length; i++) {
//         const { accessToken } = accessTokens[i];
//         await revokeAccesssToken({ accessToken: accessToken, user: username })
//     }

//     revokeAllAccessTokensWorkIndex++
//     if (revokeAllAccessTokensWorkIndex === usernames.length) {
//         return
//     }
//     await revokeAllAccessTokens()
// }

async function auth() {
    sortAuth()
    hydrateCookieStore()
    usernames = Object.keys(auths.manager)
    await runGetAuthUrl()
    // console.log(cookieStore);
    // await runGetAuthSessionUrl()
    // console.log(cookieStore);
    // await runGetAuthToken()
    // console.log(cookieStore);
    // await revokeAccesssToken()
    // await createAccesssToken()
    // console.log(JSON.parse(keys));
    // await save({ name: 'CREDS', value: keys })
    // await revokeAllAccessTokens()


    // const config: WorkerConfig = { urls: { t: "https://httpbin.org/ip",tm: "https://httpbin.org/ip",tw: "https://httpbin.org/ip" }, direct: false }
    // const  t  = await worker(config)
    // console.log(t);
}



export default auth