import { WorkerConfig } from "../utils/types";
import { worker } from "../utils/worker";
import fs from 'fs/promises'
import config from './config.json'
import store from './store.json'

async function schedulePost({ hours, minutes, username }: { hours: number, minutes: number, username: string }) {

    const postID = `Post_${Date.now()}`
    const token = "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"
    const url = `https://api.github.com/repos/thecodej3ster/editor/actions/workflows/Publish.yaml/dispatches`;
    const payload = {
        ref: 'main',
        inputs: {
            username: username
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

    const config: WorkerConfig = {
        urls: { job: "https://api.cron-job.org/" },
        requestConfig: {
            headers: {
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
                "x-api-method": "CreateJob",
                "x-ui-language": "en",
                "cookie": "refreshToken=3HJtC4hvwVn9KdOTSt9jN6dengGEprxoUK7QbALQnrz7VNIYTk7a0qZgBmCZY6qc",
                "Referer": "https://console.cron-job.org/"
            },
            method: "POST",
            body: JSON.stringify(sheduleConfig),
            responseType: "json"
        }
    }
    const { job }: Record<string, { jobId: number }> = await worker(config)
    store.jobIds.push(job.jobId)
    console.log(job);
}


async function startSchedule() {
    const postingHours = [6, 11, 17, 23]



    const accountsConfig = {
        charliekirkdaily: "",
        'charliekirk.daily': ""
    }

    const usernames = Object.keys(accountsConfig)
    let currentPostingHour = 0

    let i = 0
    const createSchedule = async () => {
        const username = usernames[i]
        let selectedMinutes = 0

        while (selectedMinutes < 5) {
            selectedMinutes = Math.round(Math.random() * 25)
        }

        if (config.lastPost === -1) {
            currentPostingHour = postingHours[0]
        } else {
            const nextPostHourIndex = postingHours.indexOf(config.lastPost) + 1
            currentPostingHour = postingHours[nextPostHourIndex]
        }

        await schedulePost({ hours: currentPostingHour, minutes: selectedMinutes, username: username })
        i++

        if (i < usernames.length) {
            await createSchedule()
        }
    }

    await createSchedule()

    if (currentPostingHour === 23) {
        config.lastPost = -1
    } else {
        config.lastPost = currentPostingHour
    }

    await fs.writeFile('./config.json', JSON.stringify(config))
    await fs.writeFile('./store.json', JSON.stringify(store))
}

startSchedule()
