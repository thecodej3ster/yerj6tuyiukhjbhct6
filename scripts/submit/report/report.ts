import { worker } from "../../utils/worker"
import { WorkerConfig } from "../../utils/types";

const tkn = "8781068686:AAG_xq7KsN6_Z15qZ_SS6NyEGjEaUMXsGxI"

export async function reportSubmit({ username }: { username: string }) {
    const reportTemplate = `Post For ${username} Suscessfully Submitted 🎉🎉🎉`

    const payload = {
        text: reportTemplate,
        chat_id: '-5555063021'
    }


    const config: WorkerConfig = {
        urls: { sendReport: `https://api.telegram.org/bot${tkn}/sendMessage` },
        requestConfig: {
            body: JSON.stringify(payload),
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }

    await worker(config)
}