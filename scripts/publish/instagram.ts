
import fs from 'fs'
import { EventPayload } from "./utils/types"
import { getChannelId } from './utils/getChannelId'



async function publish(url: string) {

    // const username = '_pulsepointmedia_youtube'
    const eventPath = process.env.GITHUB_EVENT_PATH!
    const inputsJson = fs.readFileSync(eventPath, "utf8")
    const { username, jobId, time }: EventPayload = JSON.parse(inputsJson)
    const keys = JSON.parse(process.env.Creds!)
    const key = keys[username]
    // const channelId = await getChannelId(key)

    console.log(inputsJson);
    console.log(username);
    // console.log(channelId);
    
    
}

publish("")