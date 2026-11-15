import axios, { AxiosResponseHeaders, RawAxiosRequestConfig } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";

const workerLimit = 5;
let isInit = true
let unFinishedWork: string[] = []

export async function worker({ requestConfig, direct, urls, resolverAction, resolverArgs }: WorkerConfig) {
    const result: Record<string, any> = {};
    const workers: Promise<void>[] = [];
    const failedWorks: string[] = [];
    let delay = 5000;

    const incomingHeaders = requestConfig?.headers
        ? (requestConfig.headers instanceof Headers
            ? Object.fromEntries(requestConfig.headers.entries())
            : requestConfig.headers)
        : {};

    const fetchData = (url: string, key: string): Promise<void> => {
        const selectedRequestConfig: RawAxiosRequestConfig = {
            url: url,
            data: requestConfig?.body || null,
            method: "GET",
            responseEncoding: "UTF-8",
            responseType: "text",
            // transformResponse is left to defaults; resolverAction is handled in the promise chain below
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
            selectedRequestConfig.httpsAgent = new ProxyAgent({ keepAlive: true });
        }

        return new Promise<void>((resolve, reject) => {
            axios(selectedRequestConfig)
                .then(async response => {

                    // Execute and await resolverAction here so errors propagate correctly
                    if (resolverAction) {
                        const currentArgs = resolverArgs || {};
                        return await resolverAction({
                            ...currentArgs,
                            response: response,
                            headers: response.headers as AxiosResponseHeaders
                        });
                    }
                    return response.data;
                })
                .then(data => {
                    result[key] = data;
                    delay = 5000;

                    if (unFinishedWork.length > 0) {
                        const nextKey = unFinishedWork.shift();
                        if (nextKey) {
                            const nextUrl = urls[nextKey];
                            console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
                            workers.push(fetchData(nextUrl, nextKey));
                        }
                    }
                    resolve();
                })
                .catch(error => {
                    // Track failed works for the retry mechanism
                    failedWorks.push(key);
                    reject(error);
                });
        });
    };

    async function processWorkers(works: Record<string, string>) {
        try {
            const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);

            if (isInit) {
                unFinishedWork = Object.keys(urls);
                isInit = false
            }
            
            for (let i = 0; i < concurrencyLimit; i++) {
                const key = unFinishedWork.shift();

                if (key) {
                    workers.push(fetchData(works[key], key));
                }
                console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
            }

            await Promise.all(workers);
        } catch (error) {
            console.log('REQUEST FAILED RETRYING ...');

            const failedUrls: Record<string, string> = {};

            if (delay === 30000) {
                throw error;
            }

            failedWorks.forEach(key => {
                failedUrls[key] = urls[key];
            });

            const response = await new Promise<Record<string, any>>((resolve, reject) => {
                console.log('INSIDE PROMISE');
                console.log(`Delay Is ${delay}`);

                setTimeout(async () => {
                    console.log('INSIDE TIMEOUT');
                    try {
                        const res = await worker({
                            urls: failedUrls,
                            direct: direct,
                            resolverAction: resolverAction,
                            resolverArgs: resolverArgs,
                            requestConfig: requestConfig
                        });
                        resolve(res);
                    } catch (err) {
                        console.log('OOOOOOOOOOOOPPPPPPPPPPPPSSSSSSSSSSSSSSSSSSSSSS');
                        reject(err);
                    }
                }, delay);
            });

            for (const key in response) {
                result[key] = response[key];
            }
        }
    }

    await processWorkers(urls);

    return result;
}