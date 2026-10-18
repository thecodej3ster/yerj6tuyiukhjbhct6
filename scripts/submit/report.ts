import { worker } from "../utils/worker"
import { WorkerConfig } from "../utils/types";

const tkn = "8781068686:AAG_xq7KsN6_Z15qZ_SS6NyEGjEaUMXsGxI"

export async function reportSubmit({ username }: { username: string }) {

    // type SubmissionRecord = {
    //     url: string,
    //     account_name: string
    // }

    let status = { suscess: false }

    try {
        // const { data }: { data: SubmissionRecord | null } = await db
        //     .from("submitted_posts")
        //     .select("*")
        //     .limit(1)
        //     .single()

        // if (!data) {
        //     return status
        // }

        // const submitReportBotToken = process.env.SRB_Token
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


        // await db
        //     .from("submitted_posts")
        //     .delete()
        //     .eq("url", data.url)

        status.suscess = true
    } catch (error) { }


    return status



}