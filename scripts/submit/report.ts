import { createClient } from "@supabase/supabase-js";
import { worker } from "../utils/worker"
import { WorkerConfig } from "../utils/types";

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

export async function getPostIfo() {

    type SubmissionRecord = {
        url: string,
        account_name: string
    }

    let status = { suscess: false }

    try {
        const { data }: { data: SubmissionRecord | null } = await db
            .from("submitted_posts")
            .select("*")
            .limit(1)
            .single()

        if (!data) {
            return status
        }

        const submitReportBotToken = process.env.SRB_Token
        const reportTemplate = `Post For ${data.account_name} Suscessfully Submitted 🎉🎉🎉`

        const payload = {
            text: reportTemplate,
            chat_id: process.env.SRB_GROUP_ID
        }

        console.log(JSON.stringify(payload));

        const config: WorkerConfig = {
            urls: { sendReport: `https://api.telegram.org/bot${submitReportBotToken}/sendMessage` },
            requestConfig: {
                body: JSON.stringify(payload),
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        }

        await worker(config)


        await db
            .from("submitted_posts")
            .delete()
            .eq("url", data.url)

        status.suscess = true
    } catch (error) { }


    return status



}