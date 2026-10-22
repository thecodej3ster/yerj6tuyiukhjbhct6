import { processCropPipeline } from './crop'
import { processPipPipeline } from './pip'
import { processHookPipeline } from './hook'
import { processTextPipeline } from './addText'
import { emptyGeminiStorage } from '../utils/helpers'
import { hash } from 'node:crypto'
import { worker } from '../utils/worker'
import { WorkerConfig } from '../utils/types'
import path from 'path'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const db = createClient("https://emosvfihxxpaqtmlniwe.supabase.co","sb_publishable_k9AFn4eMxM1Yid-I1gh_oA_epL6Cni9")

const r = async () => {
  // await emptyGeminiStorage()
  // await processCropPipeline()
  // await processPipPipeline()
  // await processHookPipeline()
  // await processTextPipeline()
}

(async () => {

  const e = '🤯'
  
 const svg =  `<?xml version="1.0" encoding="UTF-8"?>
<svg width="60" height="60" viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
  <rect width="60" height="60" fill="none" />
  <style>
    text {
      font-size: 60px;
    }
  </style>
  <text x="20" y="60">${e}</text>
</svg>`


    // const {error} = await db.from('serverlists')
    //     .upsert([{ id: 'tv-xxx', data: JSON.stringify(serverList) }])
    //     .eq("id", 'tv-xxx')

    //     console.log(error);
        

  // const gg = path.resolve("scripts",'temp')




  const config: WorkerConfig = { urls: { t: "https://httpbin.org/ip" }, direct: false }
  const { t } = await worker(config)
  console.log(t);

  // for (let i = 0; i < 5; i++) {
  //     await r()

  // }
  // const o = {
  //     keys: [
  //         "ZTdoNjkwc3ItemVxZzNicDpyc2Z2YWVnbTZq",
  //         "NDdxeHdhNTYtN3dlM3Q5ajp4ajkzcnE3ZGV2",
  //         "M2ptbTVsc3UteHpiNTZqcDphanNnY2Y4ZGht",
  //         "NnI0OGJ2MjktdjdjMjY1ZTp1bnZ4NWV6OTg2",
  //         "d3I2OGtlNnktMnhjczM2cDpkanlna3Nobjd1",
  //         "ZDd2Y2M0NnYtZ2J2dXNkZjplcnFiMnpqZGF0"
  //     ]
  // }

  //     const o = {
  //   keys: [
  //     "AQ.Ab8RN6JBLXkIdNG5UNEUZzFjD9ywYZ6bvOLxRqJoDZPaexS8zQ",
  //     'AQ.Ab8RN6KcqtK8f5pZaJjb2h3d7yJu5BDvLUXRxYN0tRGJ2oFzzQ',
  //     'AQ.Ab8RN6JqYnGOApdqW1U4Jv-oZE07d0HvHd6qqFvBm6cH1oSSCQ',
  //     'AQ.Ab8RN6IXQmX7D_6KtqDsT2vw2M4yZ_3DaO9U-IR9pBMAU3E5ag',
  //     'AQ.Ab8RN6JY2R5mnOCYIUaspfbRtY235up0jtuLNtsdCVnL6pw_Wg'
  //   ]
  // }
  //     console.log(JSON.stringify(o));

// const fhgjhk = {
//     vbnmn: [
//         "ZTdoNjkwc3ItemVxZzNicDpyc2Z2YWVnbTZq",
//         "NDdxeHdhNTYtN3dlM3Q5ajp4ajkzcnE3ZGV2",
//         "M2ptbTVsc3UteHpiNTZqcDphanNnY2Y4ZGht",
//         "NnI0OGJ2MjktdjdjMjY1ZTp1bnZ4NWV6OTg2",
//         "d3I2OGtlNnktMnhjczM2cDpkanlna3Nobjd1",
//         "ZDd2Y2M0NnYtZ2J2dXNkZjplcnFiMnpqZGF0"
//     ]
// }
}
)()


