import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.SB_Url!, process.env.SB_KEY!)

interface ProxyCreds {
    servers: { address: string }[],
    username: string
    password: string,
    expire_time: number
    result: string
}


export async function setProxyCreds() {
    const serverCreds: { servers: any[] } = { servers: [] }

    const getLocations = async () => {
        const locationNames = JSON.parse(process.env.Locations!).locations
        return locationNames
    }

    const locationList = await getLocations()

    let i = 0
    const updateInfo = async () => {
        const tkn = process.env.Proxy_Tkn
        const api = process.env.Proxy_Api
        const { data: serverInfo }: { data: ProxyCreds } = await axios.get(`https://${api}/user/provide?access_token=${tkn}&type=proxy&location=${locationList[i]}`, { responseType: "json" })

        if (serverInfo.result === 'SERVER_UNAVAILABLE') {
            if (i < locationList.length) {
                i++
                await updateInfo()
                return
            } else {
                return
            }
        }

        serverInfo.servers.map(server => {
            const cred = { host: "", auth: "" }
            cred.host = server.address
            cred.auth = Buffer.from(`${serverInfo.username.trim()}:${serverInfo.password.trim()}`).toString("base64")
            serverCreds.servers.push(cred)
        })
        i++
        if (i !== locationList.length) {
            await updateInfo()
        }
    }

    await updateInfo()

    const currentDir = path.resolve("scripts/utils/proxy")

    await db.from('serverlists')
        .upsert([{ id: 'tv-xxx', data: JSON.stringify(serverCreds) }])
        .eq("id", 'tv-xxx')

}