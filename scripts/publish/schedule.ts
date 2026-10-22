import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import crypto from 'crypto'
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)
const keys = JSON.parse(process.env.Creds!)

const baseHeaders = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE5MzI4MjQsInN1YiI6ODQ0Mzk2LCJzY3AiOiJzZXNzaW9uIn0.oAqAzhZymJ5196_gMyEiheZwlG7N9jNMzVh0ao_do2Y",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Brave\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "sec-gpc": "1",
    "x-api-method": "",
    "x-ui-language": "en",
    "cookie": "refreshToken=3HJtC4hvwVn9KdOTSt9jN6dengGEprxoUK7QbALQnrz7VNIYTk7a0qZgBmCZY6qc",
    "Referer": "https://console.cron-job.org/"
}


export async function createSchedule({ hours, minutes, username }: { hours: number, minutes: number, username: string }) {

    const postID = `Post_${Date.now()}`
    const token = process.env.G_Key
    // const owner = process.env.GITHUB_REPOSITORY_OWNER!
    const api = process.env.GITHUB_API_URL
    const repo = process.env.GITHUB_REPOSITORY
    const url = `${api}/repos/${repo}/actions/workflows/Clip.yaml/dispatches`;
    const jobId = crypto.randomBytes(8).toString("hex")

    const payload = {
        ref: 'main',
        inputs: {
            username: username,
            time: `${hours}`,
            jobId: `${jobId}`
        }
    }

    const sheduleConfig = {
        job: {
            title: postID,
            url: url,
            enabled: true,
            saveResponses: false,
            requestTimeout: 30,
            redirectSuccess: true,
            auth: {
                enable: false,
                user: "",
                password: ""
            },
            notification: {
                onSslCertExpiry: false,
                onSslCertExpirySeconds: 604800,
                onSuccess: false,
                onDisable: true,
                onFailure: false,
                onFailureCount: 1,
                mode: 1,
                selectedChannels: []
            },
            requestMethod: 1,
            extendedData: {
                body: JSON.stringify(payload),
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                }
            },
            schedule: {
                mdays: [
                    -1
                ],
                wdays: [
                    -1
                ],
                months: [
                    -1
                ],
                hours: [
                    hours
                ],
                minutes: [
                    minutes
                ],
                expiresAt: 0,
                timezone: "Africa/Casablanca"
            },
            folderId: 0
        }
    }

    baseHeaders["x-api-method"] = "CreateJob"

    const config: WorkerConfig = {
        urls: { job: "https://api.cron-job.org/" },
        requestConfig: {
            headers: baseHeaders,
            method: "POST",
            body: JSON.stringify(sheduleConfig),
            responseType: "json"
        }
    }
    const { job }: Record<string, { jobId: number }> = await worker(config)

    await db
        .from("jobs")
        .insert([{ id: jobId, job_id: job.jobId }])
}



export async function deleteSchedule(id: string) {

    baseHeaders["x-api-method"] = "DeleteJob"
    const payload = { jobId: id }
    const config: WorkerConfig = {
        urls: { deleteRequest: "https://api.cron-job.org/" },
        requestConfig: {
            headers: baseHeaders,
            method: "POST",
            body: JSON.stringify(payload),
            responseType: "json"
        }
    }
    const { deleteRequest }: Record<string, any> = await worker(config)


    const { error } = await db
        .from("jobs")
        .delete()
        .eq("job_id", id)

    console.log(error)    

}

let i = 0
const usernames = Object.keys(keys)
const initHour = 6
export async function initSchedule() {
    const username = usernames[i]

    await createSchedule({ username: username, hours: initHour, minutes: Math.max(5, Math.round(Math.random() * 20)) })

    i++
    if (i < usernames.length) {
        await initSchedule()
    }
}
