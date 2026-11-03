import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import crypto from 'crypto'
import { createClient } from "@supabase/supabase-js";
import { ifError } from "assert";

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
                timezone: "Africa/Lagos"
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

    console.log(job);

    if (!job.jobId) {
        throw new Error("SCHEDULE NOT CREATED");
    }


    await db
        .from("jobs")
        .insert([{ id: jobId, job_id: job.jobId }])
}



export async function deleteSchedule(id: string, isInit = false) {

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

    if (!isInit) {
        await db
            .from("jobs")
            .delete()
            .eq("job_id", id)
    }


    console.log(deleteRequest)

}

let i = 0
const usernames = Object.keys(keys)
const igPostingHours = [6, 11, 18, 23]
const ytPostingHours = [18, 0, 1, 2, 3, 4, 5, 6, 23]

export async function initSchedule() {
    if (i === 0) {
        const { data: jobQueue } = await db.from('jobs')
            .select('*')


        if (jobQueue) {
            const { error } = await db
                .from('jobs')
                .delete()
                .not('id', 'is', null)

            if (error) {
                console.log('Could NOT DELETE JOBS');
                throw new Error(error.message);
            }

            for (let i = 0; i < jobQueue.length; i++) {
                const job: { job_id: string } = jobQueue[i];
                await deleteSchedule(job.job_id, true)
            }

        }
    }


    const username = usernames[i]
    let initHour = 0
    switch (true) {
        case username.toLowerCase().includes("instagram"):
            initHour = 23 //igPostingHours[0]
            break;
        case username.toLowerCase().includes("youtube"):
            const selectedIndex = Math.round(Math.random() * (ytPostingHours.length - 1))
            initHour = ytPostingHours[selectedIndex]
            break;
    }

    let createRetries = 0
    const create = async () => {
        try {
            await createSchedule({ username: username, hours: initHour, minutes: Math.max(5, Math.round(Math.random() * 20)) })
        } catch (error) {
            if (createRetries === 10) {
                throw new Error("FAILED To CREATE SCHEDULE");
            }
            createRetries++
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    create()
                        .then(() => {
                            resolve()
                        })
                }, 5000);
            })
        }
    }
    await create()


    i++
    if (i < usernames.length) {
        await initSchedule()
    }
}
