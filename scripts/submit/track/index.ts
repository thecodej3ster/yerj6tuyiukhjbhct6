import { createClient } from "@supabase/supabase-js";
import { PostRecord } from "./types";
import trackYt from './youtube'
import trackIg from './instagram'

const db = createClient(process.env.SB_Url!, process.env.SB_Key!)

async function track() {
    const { data: lastSubmittedPost, error } = await db.from("track_points")
        .select("*")
        .order("updated_at", { ascending: true })
        .limit(1)
        .single<PostRecord>()


        console.log(`${lastSubmittedPost?.username} ${lastSubmittedPost?.platform}`);
        
    if (error) {
        throw error
    }

    if (!lastSubmittedPost) {
        throw new Error("Track Point Not Found");
    }

    switch (lastSubmittedPost.platform) {
        case "instagram":
            await trackIg(lastSubmittedPost)
            break;

        case "youtube":
            await trackYt(lastSubmittedPost)
            break;
    }

}

track()