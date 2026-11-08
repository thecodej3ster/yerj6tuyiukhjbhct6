import { worker } from "../utils/worker"
import crypto from "crypto"
import { WorkerConfig, ResolverArgs } from '../utils/types'
import { createClient } from "@supabase/supabase-js"


const db = createClient(process.env.SB_Url!, process.env.SB_Key!)



async function getIdByUsername(username: string) {

    const workerConfig: WorkerConfig = {
        urls: { userId: `https://www.instagram.com/${username}` },
        resolverAction: async ({ response }: ResolverArgs) => {
            const accountData = response as string
            let userId = ""
            let pageId = ""
            const foundUserId = accountData.match(/(?<=props\":{\"id\":\")\d+/)
            const foundPageId = accountData.match(/(?<={\"end_cursor\":\")[^"]+/)

            if (foundUserId) {
                userId = foundUserId[0]
            }

            if (foundPageId) {
                pageId = foundPageId[0]
            }
            return { userId: userId, pageId: pageId }
        }
    }


    const user = await worker(workerConfig) as { userId: string, pageId: string }
    return user
}




async function fetchPosts({ userId, username, pageId }: { userId: string, username: string, pageId: string }) {

    interface VideoSearchRespose {
        foundVideos: string[],
        next: string
    }

    interface VideoNode {
        node: { shortcode: string }
    }

    let videoUrls: Record<string, string>[] = []

    // ?doc_id=28904005159232689&variables={"id":"${userId}","after":"","first":12}`
    const payload = new URLSearchParams()
    payload.append("id", userId)
    payload.append("after", "")
    payload.append("first", "12")
    payload.append("doc_id", "28904005159232689")
    // const url = `https://www.instagram.com/graphql/query/${payload}`

    // const payload = {
    //     id: userId,
    //     after: "",
    //     first: 12,
    //     doc_id: 28904005159232689
    // }
    const url = "https://www.instagram.com/api/graphql"

    // const variables = JSON.stringify({
    //     "after": pageId,
    //     "first": 12,
    //     "id": userId,
    //     "__relay_internal__pv__PolarisSEOIsCrawlerrelayprovider": false
    // })

    // const payload = new URLSearchParams()
    // payload.append("lsd", "AdRXMrl7XuP_BlBb1TYbntj72gA")
    // payload.append("variables", variables)
    // payload.append("doc_id", "28904005159232689")
    // payload.append("csrftoken", "j08CBzZtuPmDNwhq_Oli3V")

    const config: WorkerConfig = {
        urls: { posts: url },
        requestConfig: {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.8",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-full-version-list": "\"Brave\";v=\"143.0.0.0\", \"Chromium\";v=\"143.0.0.0\", \"Not A(Brand\";v=\"24.0.0.0\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-model": "\"\"",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-ch-ua-platform-version": "\"6.14.0\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-asbd-id": "359341",
                "x-csrftoken": "8MMH47etTy-Clxt0AszczB",
                "x-fb-entry-nonce": "DolxFmr9",
                "x-fb-friendly-name": "PolarisLoggedOutDesktopWWWProfilePostsTabContentQuery_connection",
                "x-fb-lsd": "AdRXMrl7XuP_BlBb1TYbntj72gA",
                "x-ig-app-id": "936619743392459",
                "x-ig-max-touch-points": "0",
                "cookie": "csrftoken=8MMH47etTy-Clxt0AszczB; datr=8nQ1asgVUis8L8nl_87YZR0p; ig_did=4705D0F2-0D00-4AFD-88A5-2339953BA514; mid=ajV09AAEAAF_SgKMV9myFslN1BFf; ig_nrcb=1; ps_l=1; ps_n=1; wd=301x621",
                "Referer": "https://www.instagram.com/theflashpoint88"
            },
            "body": "av=0&__d=www&__user=0&__a=1&__req=o&__hs=20764.HYP%3Ainstagram_web_pkg.2.1...0&dpr=1&__ccg=EXCELLENT&__rev=1053563438&__s=lus5rz%3Avr4ucu%3Acobf3h&__hsi=7705339893985871874&__dyn=7xe5WwlEnwn8yEqxemh0no6u5U4e1ZyUW3qi7UK360CEboG0le4o0B-q1ew6ywMwto2awgo9oO0n24oaEnxO1ywOwv89k2C1FwnE6a0D85m263ifK0EUjwGzEaE2iwNwmE2eUlwhE2Lw6OyES1TwVwDwHg2ZwrUK2K2WErwcW269wr84-6o5qdwBwUQp1yU426V8aUuwm8jwsE2xyVrx60hK3KawOCwgo6K1cweW3mdg5e1awNw&__csr=g94aNlMJ96Nkn95H258hlcJNcWSBEGEAAA-Lmy5Ahem_8BlAdOdJqFr4h2aG7JGAVeXggHZqAAiOaBqkEyV5lcB9ftRkJVaiPmJAJdPlkFujCij-GxhuiBGeVpFGCGmHmWy94GiKCcguypoqzRyosAzV4byHJohAxKaCxSWHLyE4CmFWKEHgWeBz-eJ1qq9x6eyUjghzd7xzyoSfAGm7o8UPADG2fEx88U-5ElWjiUyQmU8F8qwg8rw2gUycxa06Z801njU088oco1SIw0H_x204crc042Uqg3TUK0Fov80DCq9gOG810wIxK2C1dG5oeU6cyxl1so0-80gewQP3920Bw2kEiw15J1y01Otw2xo046O0frw&__hsdp=g8YI23Egw8f2FP4VmATgO5o-EB6igGF99NKQcwOxGP91mCsl4xWbxm3fx9wiE31wG8d84m26EK2bxV1yi4Cqsyg4yi10KfDw4fxu1MwExi58lK3a1vzE5S78e83QwfSjAxy1eDwmEuxmi2yEb82Hwr8ow4Mw6kw5sw4Wwl80osweTwpE1g83BU1JUqw4Fw6dU0MC08OEw5acwtU1fE5KdU85l0&__hblp=0hU663-3a78cEGcxaucwOwZw-wxwyzUuyo4Saguz8hw8-4EepRxCaxKAbDAAxiq7UG3610KfDzo722O3O2q5Xwr8a8kAwBK3a3S26ewFwPx2bwUg2GzGwSwg82yxCRAxy1eDwmEuxmi2yEb8d-E6W1Ixy0wo2GK1uwVxa5oO0NoeE7u1owk81eE5i0d1wr80zm3u3a0AE9-3m323q1fwi8kxu3KuE0FO6E12-6XzU1uu0c9xu0iGbwaa5UyfzW81iz8y1Kw8m18wAwiE5KdU85l0&__sjsp=g8YI23FO88gosay4vBqjt38lxa9hAAdypNKQcws8fE0y2&__comet_req=7&lsd=AdRXMrl7XuP_BlBb1TYbntj72gA&jazoest=22332&__spin_r=1053563438&__spin_b=trunk&__spin_t=1794039247&__crn=comet.igweb.PolarisLoggedOutDesktopWWWProfileRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisLoggedOutDesktopWWWProfilePostsTabContentQuery_connection&server_timestamps=true&variables=%7B%22after%22%3A%22AQHTwYPugPok2NKH4hwJT-QGN6c-SWwORdDCRd6gePHVbAai4a2dEP7NK6-ZzmgBZvJUTWlBhdRHBCi-sl-NLdrAiw%22%2C%22first%22%3A12%2C%22id%22%3A%2217841413815264286%22%2C%22__relay_internal__pv__PolarisSEOIsCrawlerrelayprovider%22%3Afalse%7D&doc_id=28904005159232689",
            "method": "POST"

        },
        resolverAction: async ({ response }: ResolverArgs) => {
            const result: VideoSearchRespose = { foundVideos: [], next: "" }
            // const accountInfo = JSON.parse(response)
            console.log(response);

            // const nodesObjects: VideoNode[] = accountInfo.data.user.edge_owner_to_timeline_media.edges
            // result.next = accountInfo.data.user.edge_owner_to_timeline_media.page_info.end_cursor
            // nodesObjects.map(nodesObject => result.foundVideos.push(nodesObject.node.shortcode))
            // return result
        }
    }


    const { posts } = await worker(config)
    console.log(posts);













    // const send = async (urls: Record<string, string>) => {
    //     const workerConfig: WorkerConfig = {
    //         urls: urls,
    //         resolverAction: async (args: Record<string, string>): Promise<string> => {
    //             let foundVideos: string = ""
    //             const workerResponse: VideoSearchRespose = { foundVideos: "", next: "" }
    //             const response = args.response
    //             const accountInfo = JSON.parse(response)
    //             const nodesObjects: VideoNode[] = accountInfo.data.user.edge_owner_to_timeline_media.edges
    //             workerResponse.next = accountInfo.data.user.edge_owner_to_timeline_media.page_info.end_cursor
    //             nodesObjects.map(nodesObject => foundVideos += `${nodesObject.node.shortcode},`)
    //             workerResponse.foundVideos = foundVideos
    //             return JSON.stringify(workerResponse)
    //         }
    //     }

    //     const workerResponse = await worker(workerConfig)

    //     for (const id in workerResponse) {
    //         try {
    //             const data: VideoSearchRespose = JSON.parse(workerResponse[id])
    //             videoUrls.push(workerResponse)
    //             if (data.next.length) {
    //                 workerUrls[id] = `https://www.instagram.com/graphql/query/?doc_id=7950326061742207&variables={"id":"${id}","after":"${data.next}","first":12}`
    //             } else {
    //                 delete workerUrls[id]
    //             }
    //         } catch (error) {
    //             console.log(error);
    //             console.log(workerResponse[id]);

    //             throw error

    //         }

    //     }


    //     if (!Object.keys(workerUrls).length) {
    //         return
    //     }



    //     await send(workerUrls)
    // }

    // const workerUrls: Record<string, string> = {}

    // for (let i = 0; i < accountIds.length; i++) {
    //     workerUrls[accountIds[i]] =
    //         `https://www.instagram.com/graphql/query/?doc_id=7950326061742207&variables={"id":"${accountIds[i]}","after":"","first":12}`
    // }

    // await send(workerUrls)



    // for (let i = 0; i < videoUrls.length; i++) {
    //     const response = videoUrls[i]
    //     for (const accountId in response) {
    //         const data: VideoSearchRespose = JSON.parse(response[accountId])
    //         const foundVideos: string[] = data.foundVideos.split(",").flat()
    //         foundVideos.pop()
    //         for (let j = 0; j < foundVideos.length; j++) {
    //             const username = Object.fromEntries(Object.entries(accounts).map(([key, val]) => [val, key]))[accountId]
    //             const key = crypto.randomBytes(8).toString("hex")
    //             workerUrls[key] = `https://www.instagram.com/${username}/reel/${foundVideos[j]}/`
    //         }
    //     }
    // }

    // const workerConfig: WorkerConfig = {
    //     urls: workerUrls,
    //     resolverAction: async (args: Record<string, string>): Promise<string> => {
    //         const resolverResponse: { error: string, data: string } = { error: "", data: "" }
    //         const maxDuration = 40
    //         const durationMatch = args.response.match(/(?<=mediaPresentationDuration=\\"PT)[0-9]+/)
    //         if (!durationMatch || Number(durationMatch[0]) > maxDuration) {
    //             resolverResponse.error = "too long"
    //         } else {
    //             const codeMatch = args.response.match(/(?<=reel\/)[^\/]+/)
    //             resolverResponse.data = codeMatch ? codeMatch[0] : ""
    //         }
    //         return JSON.stringify(resolverResponse)
    //     }
    // }

    // const videoFilterWorkerResponse = await worker(workerConfig)
    // const filteredVieos: string[] = []

    // for (const id in videoFilterWorkerResponse) {
    //     const response: { data: string, error: string } = JSON.parse(videoFilterWorkerResponse[id])

    //     if (response.data.length > 0) {
    //         filteredVieos.push(response.data)
    //     }
    // }

    // try {
    //     await savePosts(filteredVieos)
    // } catch (error) {
    //     console.log(error);
    // }
    // console.log(filteredVieos);
}

async function savePosts(posts: string[]) {
    const dbPayload: Record<string, string>[] = []

    for (let i = 0; i < posts.length; i++) {
        console.log(`https://www.instagram.com/reel/${posts[i]}`)

        const field: Record<string, string> = { code: posts[i] }
        dbPayload.push(field)
    }

    const { data, error } = await db.from("videos").insert(dbPayload).select("*")

    if (error) {
        console.log(error);
        throw error
    }

    console.log(data);

}

// const accounts: string[] = ["theflashpoint88","unfilteredstate","thinkerzcircle"]

async function init() {
    const usernames: string[] = ["theflashpoint88"]
    const userIds: string[] = []
    const pageIds: Record<string, string> = {}

    let userIDWorkIndex = 0
    const runGetUserId = async () => {
        const username = usernames[userIDWorkIndex]
        const user = await getIdByUsername(username)
        userIds.push(user.userId)
        pageIds[username] = user.pageId
        userIDWorkIndex++

        if (userIDWorkIndex === usernames.length) {
            return
        }
        await runGetUserId()
    }

    let fetchPostsWorkIndex = 0
    const runfetchPosts = async () => {
        const username = usernames[fetchPostsWorkIndex]
        const posts = await fetchPosts({ username: username, userId: userIds[fetchPostsWorkIndex], pageId: pageIds[username] })


        fetchPostsWorkIndex++
        if (fetchPostsWorkIndex === userIds.length) {
            return
        }
        await runfetchPosts()
    }

    await runGetUserId()
    await runfetchPosts()
}
init()