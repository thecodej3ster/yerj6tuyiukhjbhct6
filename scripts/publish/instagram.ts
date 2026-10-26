
import fs from 'fs'
import { EventPayload } from "./utils/types"
import { getChannelId } from './utils/getChannelId'



async function publish(url: string) {

    // const username = '_pulsepointmedia_youtube'
    const eventPath = process.env.GITHUB_EVENT_PATH!
    const { inputs }: { inputs: EventPayload } = JSON.parse(fs.readFileSync(eventPath, "utf8"))
    const { username, jobId, time } = inputs
    const keys = JSON.parse(process.env.Creds!)
    const key = keys[username]
    let channelId = ""

    switch (true) {
        case username.includes("instagram"):
            channelId = await getChannelId({ key: key, platform: "instagram" })
            break;

        case username.includes("youtube"):
            channelId = await getChannelId({ key: key, platform: "youtube" })
            break;
    }


    // console.log(inputsJson);
    console.log(username);
    console.log(channelId);


}

publish("")