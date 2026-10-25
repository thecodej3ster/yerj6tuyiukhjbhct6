import { worker } from "../utils/worker"
import { WorkerConfig } from "../utils/types";
import { reportSubmit } from './report/report'


async function getAuth() {
    const workerConfig: WorkerConfig = {
        urls: { getAuth: "https://securetoken.googleapis.com/v1/token?key=AIzaSyBcpP2tonTnVR3oT8LiAjjw1_h2MnArPn4" },
        requestConfig: {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1",
                "x-client-version": "Chrome/JsCore/10.12.5/FirebaseCore-web",
                "x-firebase-gmpid": "1:436816715910:web:99094002e79d541d403107"
            },
            method: "POST",
            body: "grant_type=refresh_token&refresh_token=AMf-vBzkMNIzRRPylFeBpdDSNvsC2PWYjeDfaDc8xz5zgL2odVxF1wghCbIB7jhgdsw-vLp73VbYMVdK3wdxGZz7pSrSn45q-hGk6LMcS2jVYnFQ5wvAOCnF3fXFckvdudMrrs1551mz2rILaUaufRGHJ4yfhej3h0CefBXynjp1B_xZKcXqU8piqu118ppUxTQYYAUSuwu6miptl_vfFyeZyoitSdhQxfH0p_TPuEVAoMq1Vh4w2uatIltNA_ORU_ctpkWuF1wQ"
        }
    }

    const data = await worker(workerConfig)
    const token = JSON.parse(data.getAuth).access_token
    return token

}

interface SubmissionQueueRecord {
    url: string,
    account_name: string
}



export async function submit({ campaignId, url }: { campaignId: string, url: string }) {

    const token = await getAuth()
    const status = { suscess: false }

    const payload = JSON.stringify({ url: url })

    let workerConfig: WorkerConfig = {
        urls: { handleLookup: "https://monsterlab.io/api/social-media/lookup-handle" },
        requestConfig: {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "cookie": "__stripe_mid=bff88e09-ca00-4dfe-8883-4ae4b63d75cc46edbe; __stripe_sid=4b36f823-c874-470b-a716-82179021d07580f0c8",
                "origin": "https://monsterlab.io",
                "referrer": "https://monsterlab.io/dashboard/clips?tab=campaigns",
                "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
            },
            method: "POST",
            responseType: "json",
            body: payload
        }
    }

    const { handleLookup } = await worker(workerConfig) as { handleLookup: { handle: string, platform: string, resolvedUrl: string } | undefined }

    if (!handleLookup) {
        console.log(handleLookup);
        throw new Error('Could not Find Handle')
    }

    const { handle, platform, resolvedUrl } = handleLookup


    const cleanHandle = handle.replace("@", "")
    const submitPayload = {
        url: resolvedUrl,
        priority: "normal",
        campaignId: campaignId,
        accountId: `${platform}_${cleanHandle}`,
        source: "modal"
    }

    workerConfig = {
        urls: { submit: "https://monsterlab.io/api/social-media/monitor" },
        requestConfig: {
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.7",
                "authorization": `Bearer ${token}`,
                "cache-control": "no-cache",
                "content-type": "application/json",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "referrer": "https://monsterlab.io/dashboard/clips?tab=campaigns",
                "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "cookie": "__stripe_mid=bff88e09-ca00-4dfe-8883-4ae4b63d75cc46edbe; __stripe_sid=4b36f823-c874-470b-a716-82179021d07580f0c8"
            },
            method: "POST",
            body: JSON.stringify(submitPayload)
        }
    }

    const { submit } = await worker(workerConfig)

    try {
        const submission = JSON.parse(submit)
        console.log(submission);

        if (submission.success) {
            const reelCodeSearch = resolvedUrl.match(/(?<=p\/)[^\/]+/)
            if (reelCodeSearch) {
                await reportSubmit({ username: cleanHandle })
            }
        }

    } catch (error) { }

    return status
}
