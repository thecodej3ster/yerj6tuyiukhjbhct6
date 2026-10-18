import fs from 'fs/promises'
import locations from './locations.json'
import path from 'path'
import axios from 'axios'

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
        const locationNames = Object.keys(locations)
        return locationNames
    }

    const authLifeStore: { items: any[] } = { items: [] }

    const locationList = await getLocations()

    let i = 0
    const updateInfo = async () => {
        // console.log("serverInfo");
        const tkn = "CAESKAoIdG91Y2h2cG4Q6NKI3QcY4r6VgggiEGYyOTQ3MzUwNjg2NmMzMjMaINPkTO4z7bYGbNBz8-cSeZ3VUpPR27q8BRhWC1_isoPx"
        const { data: serverInfo }: { data: ProxyCreds } = await axios.get(`https://api.pango-cloud.com/user/provide?access_token=${tkn}&type=proxy&location=${locationList[i]}`, { responseType: "json" })
        // const serverInfo: ProxyCreds = 
        const authLife = { name: "", expires: 0 }

        // console.log(serverInfo);
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
            authLife.name = locationList[i]
            authLife.expires = serverInfo.expire_time
            serverCreds.servers.push(cred)
            authLifeStore.items.push(authLife)
        })
        i++
        if (i !== locationList.length) {
            await updateInfo()
        }
    }

    await updateInfo()

    const currentDir = path.resolve("scripts/utils/proxy")

    await fs.writeFile(path.join(currentDir, "authLife.json"), JSON.stringify(authLifeStore))
    await fs.writeFile(path.join(currentDir, "serverList.json"), JSON.stringify(serverCreds))
}