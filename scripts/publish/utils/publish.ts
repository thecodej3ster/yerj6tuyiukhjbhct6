import { worker } from "../../utils/worker"
import { WorkerConfig } from "../../utils/types"

async function publish({ payload, key }: { payload: { query: string, variables: Record<string, any> }, key: string }) {
    const config: WorkerConfig = {
        urls: {
            postInfo: "https://api.buffer.com"
        },
        requestConfig: {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`,
            },
            body: JSON.stringify(payload),
            responseType: "json",
            method: "POST"
        }

    }

    const { postInfo } = await worker(config)
    console.log(postInfo);
    
}

export { publish }
