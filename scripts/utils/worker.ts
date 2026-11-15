import axios, { AxiosResponse, RawAxiosRequestConfig, AxiosResponseTransformer, AxiosResponseHeaders } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";


const workerLimit = 5

// let workerResponse: AxiosResponse<any, any, {}, any>

export async function worker({ requestConfig, direct, urls, resolverAction, resolverArgs }: WorkerConfig) {
    const result: Record<string, any> = {};
    const unFinishedWork = Object.keys(urls);

    const incomingHeaders = requestConfig?.headers
        ? (requestConfig.headers instanceof Headers
            ? Object.fromEntries(requestConfig.headers.entries())
            : requestConfig.headers)
        : {};

    const handleResolver: AxiosResponseTransformer = async (response: AxiosResponse, headers: AxiosResponseHeaders) => {
        // workerResponse = response
        if (resolverAction) {
            if (resolverArgs) {
                return await resolverAction({ ...resolverArgs, ...{ response: response, headers: headers } })
            } else {
                return await resolverAction({ response: response, headers: headers })
            }
        }
        return response;
    }

    const failedWorks: string[] = []
    let delay = 5000

    const fetchData = async (url: string, key: string): Promise<void> => {

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
        try {
            let response = await axios(selectedRequestConfig)
            result[key] = await response.data
            delay = 5000

            // FIX 3: Process the next item in the queue recursively matching your original architecture 
            if (unFinishedWork.length > 0) {
                const nextKey = unFinishedWork.shift()
                if (nextKey) {
                    const nextUrl = urls[nextKey];
                    console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
                    await fetchData(nextUrl, nextKey);
                }
            }
        } catch (error) {
            failedWorks.push(key)
            // result[key] = error
            delay += 5000
            throw error
        }


    };

    async function processWorkers(works: Record<string, string>) {

        try {

            // FIX 4: Concurrency Limit and Execution Wrapper
            const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);
            const initialWorkers: Promise<void>[] = [];

            for (let i = 0; i < concurrencyLimit; i++) {
                const key = unFinishedWork.shift();

                if (key) {
                    initialWorkers.push(fetchData(works[key], key));
                }
                console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);

            }

            try {
                await Promise.all(initialWorkers)

            } catch (error) {

            }
        } catch (error) {
            console.log('REQUEST FAILED RETRYING ...');
            const failedUrls: Record<string, string> = {}

            if (delay === 30000) {
                console.log('delay Gone');

                throw error
            }


            failedWorks.map(key => {
                failedUrls[key] = urls[key]
            })
            console.log(failedUrls);

            const response = await new Promise<Record<string, any>>((resolve, reject) => {
                console.log('INSIDE PROMISE');
                console.log(`Delay Is ${delay}`);

                setTimeout(() => {
                    console.log('INSIDE TIMEOUT');
                    resolve({})
                    // try {
                    //     console.log("hi");

                    //     const response = await worker({
                    //         urls: failedUrls,
                    //         direct: direct,
                    //         resolverAction: resolverAction,
                    //         resolverArgs: resolverArgs,
                    //         requestConfig: requestConfig
                    //     })
                    //     resolve(response)
                    // } catch (error) {
                    //     console.log('OOOOOOOOOOOOPPPPPPPPPPPPSSSSSSSSSSSSSSSSSSSSSS');

                    //     reject(error)
                    // }

                }, 0);

            })

            // for (const key in response) {
            //     result[key] = response[key]
            // }
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