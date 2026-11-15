import axios, { AxiosResponse, RawAxiosRequestConfig, AxiosResponseTransformer, AxiosResponseHeaders } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";
import { error } from "node:console";


const workerLimit = 5
// let workerResponse: AxiosResponse<any, any, {}, any>

export async function worker({ requestConfig, direct, urls, resolverAction, resolverArgs }: WorkerConfig) {
    const result: Record<string, any> = {};
    const unFinishedWork = Object.keys(urls);
    const workers: Promise<void>[] = [];

    const incomingHeaders = requestConfig?.headers
        ? (requestConfig.headers instanceof Headers
            ? Object.fromEntries(requestConfig.headers.entries())
            : requestConfig.headers)
        : {};

    const handleResolver: AxiosResponseTransformer = async (response: AxiosResponse, headers: AxiosResponseHeaders) => {
        // workerResponse = response
        if (resolverAction) {
            resolverArgs = resolverArgs || {}
            return resolverAction({ ...resolverArgs, ...{ response: response, headers: headers } })
            //     if (resolverArgs) {
            //         return await resolverAction({ ...resolverArgs, ...{ response: response, headers: headers } })
            //     } else {
            //         return await resolverAction({ response: response, headers: headers })
            //     }
            // return new Promise<any>(async (resolve, reject) => {
            //     try {
            //         const resolverResponse = await resolverAction({ ...resolverArgs, ...{ response: response, headers: headers } })
            //         resolve(resolverResponse)
            //     } catch (error) {
            //         reject(error)
            //     }
            // })
            // return 
        }
        // return response;

    }

    const failedWorks: string[] = []
    let delay = 5000

    const fetchData = (url: string, key: string): Promise<void> => {


        const selectedRequestConfig: RawAxiosRequestConfig = {
            url: url,
            data: requestConfig?.body || null,
            // timeout: 30000,
            method: "GET",
            responseEncoding: "UTF-8",
            responseType: "text",
            transformResponse: ([] as AxiosResponseTransformer[])
                .concat(axios.defaults.transformResponse || [])
                .concat([handleResolver]).filter(Boolean),
            ...requestConfig,
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Priority": "u=0, i",
                "TE": "trailers",
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0",
                ...incomingHeaders,
            } as Record<string, string>
        };

        if (!direct) {
            selectedRequestConfig.httpsAgent = new ProxyAgent({ keepAlive: true })
        }

        return new Promise<void>((resolve, reject) => {
            // try {
            axios(selectedRequestConfig)
                .then(response => response.data)
                .then(data => {
                    result[key] = data
                    delay = 5000

                    if (unFinishedWork.length > 0) {
                        const nextKey = unFinishedWork.shift()
                        if (nextKey) {
                            const nextUrl = urls[nextKey];
                            console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
                            workers.push(fetchData(nextUrl, nextKey))
                            // await fetchData(nextUrl, nextKey);
                        }
                    }
                    resolve()
                })
                .catch(error => {
                    reject(error)
                })
            // let response = await axios(selectedRequestConfig)
            // console.log('AM GOOD 1');

            // result[key] = await response.data

            // console.log('AM GOOD 2');

            // delay = 5000

            // // FIX 3: Process the next item in the queue recursively matching your original architecture 
            // if (unFinishedWork.length > 0) {
            //     const nextKey = unFinishedWork.shift()
            //     if (nextKey) {
            //         const nextUrl = urls[nextKey];
            //         console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
            //         await fetchData(nextUrl, nextKey);
            //     }
            // }
            // resolve()
            // } catch (error) {
            //     failedWorks.push(key)
            //     // result[key] = error
            //     delay += 5000
            //     reject(error)
            // }
        })
    };

    async function processWorkers(works: Record<string, string>) {

        try {

            // FIX 4: Concurrency Limit and Execution Wrapper
            // const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);

            // const initialWorkers: Promise<void>[] = [];

            // for (let i = 0; i < concurrencyLimit; i++) {
            //     const key = unFinishedWork.shift();

            //     if (key) {
            //         initialWorkers.push(fetchData(works[key], key));
            //     }
            //     console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);

            // }

            // try {
            //     await Promise.all(initialWorkers)

            // } catch (error) {
            //     console.log('YEAAAAAAAAAAAAAAAAAAA');

            // }

            const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);


            for (let i = 0; i < concurrencyLimit; i++) {
                const key = unFinishedWork.shift();

                if (key) {
                    workers.push(fetchData(works[key], key));
                }
                console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);

            }

            // try {
            await Promise.all(workers)

            // } catch (error) {
            //     console.log('YEAAAAAAAAAAAAAAAAAAA');

            // }
        } catch (error) {
            console.log('REQUEST FAILED RETRYING ...')

            const failedUrls: Record<string, string> = {}

            if (delay === 30000) {
                throw error
            }

            failedWorks.map(key => {
                failedUrls[key] = urls[key]
            })

            const response = await new Promise<Record<string, any>>((resolve, reject) => {
                console.log('INSIDE PROMISE');
                console.log(`Delay Is ${delay}`);

                setTimeout(async () => {
                    console.log('INSIDE TIMEOUT');
                    try {
                        console.log("hi");

                        const response = await worker({
                            urls: failedUrls,
                            direct: direct,
                            resolverAction: resolverAction,
                            resolverArgs: resolverArgs,
                            requestConfig: requestConfig
                        })
                        resolve(response)
                    } catch (error) {
                        console.log('OOOOOOOOOOOOPPPPPPPPPPPPSSSSSSSSSSSSSSSSSSSSSS');

                        reject(error)
                    }

                }, delay);

            })

            for (const key in response) {
                result[key] = response[key]
            }
        }
    }

    // if (failedWorks.length) {
    //     //  failedWorks.map(key => {
    //     //     console.log(result[key]);
    //     // })
    //     // throw new Error("Some Works Were Unable To Process");
    // }
    // const newWork: Record<string, string> = {}
    // if (failedWorks.length && !isRetry) {
    //     console.log('RETRYING ...');

    // failedWorks.map(key => {
    //     newWork[key] = works[key]
    // })
    //     isRetry = true
    //     await processWorkers(newWork)
    // }
    // }


    // try {
    await processWorkers(urls)

    // } catch (error) {

    // }

    return result;
}