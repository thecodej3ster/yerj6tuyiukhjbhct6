import { EventPayload } from "./types"
import fs from 'fs'

function getDispatchPayload() {
    const eventPath = process.env.GITHUB_EVENT_PATH!
    const { inputs }: { inputs: EventPayload } = JSON.parse(fs.readFileSync(eventPath, "utf8"))
    return inputs
}

export { getDispatchPayload }