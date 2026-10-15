import { retrive } from "../utils/retriveVideo";
import { createClient } from "@supabase/supabase-js";
import { processCropPipeline } from "../crop";
import { processPipPipeline } from "../pip";
import { processHookPipeline } from "../hook";
import { processTextPipeline } from "../addText";

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co", "sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

async function getVideo() {


    interface VideoMetaData {
        video_id: string
        content: string
    }

    await processCropPipeline()
    // await processPipPipeline()
    // await processHookPipeline()
    // await processTextPipeline()

    const video = await retrive({ table: "editted_videos", autoDelete: true })

    const { data: videoDescription } = await db
        .from("video_description")
        .select("*")
        .eq("video_id", video.video_id)
        .limit(1)
        .single()



    await db
        .from("video_descriptions")
        .delete()
        .eq("video_id", video.video_id)



    console.log(videoDescription);
    console.log(video.url);
    // console.log();


    //     async function shareReelNow() {
    //         const query = `
    //     mutation ShareReelNow($input: CreatePostInput!) {
    //       createPost(input: $input) {
    //         ... on PostActionSuccess {
    //           post {
    //             id
    //             status
    //           }
    //         }
    //         ... on MutationError {
    //           message
    //         }
    //       }
    //     }
    //   `;

    // Get or generate your 3-minute temporary URL right before triggering this call
    //     const temporaryVideoUrl = "https://your-temp-storage.com/video.mp4?expires=123456";

    //     const variables = {
    //         input: {
    //             text: "Instant Reel post test!",
    //             channelId: "YOUR_CHANNEL_ID",
    //             schedulingType: "automatic",
    //             mode: "shareNow",
    //             assets: [
    //                 {
    //                     url: temporaryVideoUrl,
    //                     type: "video"
    //                 }
    //             ]
    //         }
    //     };

    //     const response = await fetch("https://api.buffer.com", {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             Authorization: "Bearer YOUR_API_KEY",
    //         },
    //         body: JSON.stringify({ query, variables }),
    //     });

    //     const result = await response.json();
    //     console.log(JSON.stringify(result, null, 2));
    // }

    // shareReelNow();
}

getVideo()