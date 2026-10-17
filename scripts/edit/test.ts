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

const r = async () => {
  // await emptyGeminiStorage()
  // await processCropPipeline()
  // await processPipPipeline()
  // await processHookPipeline()
  // await processTextPipeline()
}

(async () => {
  // const gg = path.resolve("scripts",'temp')




  // const config: WorkerConfig = { urls: { t: "https://httpbin.org/ip" } }
  // const { t } = await worker(config)
  // console.log(t);

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

  // const hash = "220841651:1:1791473707:303333b8cd219781cf3523057b2a9749f2055a1add:d8aea3f4a63fc2ed516148e516ff20a0cf4dc28c51"
  // const vee = await fetch("https://hibchr.com/api/server/list/", {
  //     "credentials": "include",
  //     "headers": {
  //         "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0",
  //         "Accept": "application/json",
  //         "Accept-Language": "en-US,en;q=0.5",
  //         "Content-Type": "application/json",
  //         "Authorization": "Bearer 0s-lYv85fkLSnUNe6wOySdDn3kgej68G_1794068689",
  //         "Sec-GPC": "1",
  //         "Sec-Fetch-Dest": "empty",
  //         "Sec-Fetch-Mode": "cors",
  //         "Sec-Fetch-Site": "same-origin",
  //         "Priority": "u=4"
  //     },
  //     "body": "{\"protocol\":\"https\",\"region\":\"us-or\",\"type\":0}",
  //     "method": "POST",
  //     "mode": "cors"
  // })
  // const b = await vee.json()

  // console.log(b.data);

}
)()


