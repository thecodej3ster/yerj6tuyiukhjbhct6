import axios, { AxiosResponse, RawAxiosRequestConfig, AxiosResponseTransformer, AxiosResponseHeaders } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";
import { CookieStore } from "./cookie";

// {username:{domain:{}}}
const workerLimit = 5
// let workerResponse: AxiosResponse<any, any, {}, any>
const cookieStore: Record<string, Record<string, Record<string, string>>> = {}
const result: Record<string, any> = {};
let unFinishedWork: string[] = []
let isInit = true
const redirectCount: Record<string, number> = {}
let maxRedirect = 0

export async function worker({ requestConfig, direct, urls, resolverAction, resolverArgs }: WorkerConfig) {
    const workers: Promise<void>[] = [];
    const failedWorks: string[] = []
    let delay = 5000

    const incomingHeaders = requestConfig?.headers
        ? (requestConfig.headers instanceof Headers
            ? Object.fromEntries(requestConfig.headers.entries())
            : requestConfig.headers)
        : {};



    const fetchData = (url: string, key: string): Promise<void> => {
        if (!redirectCount[key]) {
            redirectCount[key] = 0
        }
        if (requestConfig?.maxRedirects) {
            maxRedirect = requestConfig.maxRedirects
            requestConfig.maxRedirects = 0
        }
        const selectedRequestConfig: RawAxiosRequestConfig & { body?: any } = {
            url: url,
            ...requestConfig,
            data: requestConfig?.body || null,
            method: "GET",
            responseEncoding: "UTF-8",
            responseType: "text",
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
            } as Record<string, string>,
            validateStatus: (status) => status < 400 && status > 199
        }

        if (selectedRequestConfig.body) {
            delete selectedRequestConfig.body
        }

        if (!direct) {
            selectedRequestConfig.httpsAgent = new ProxyAgent({ keepAlive: true })
        }

        const cookieStore = new CookieStore({ storeId: key, url: url })
        const cookie = cookieStore.get({}) as string[]
        const cookieString = cookie.join(';')

        if (selectedRequestConfig.headers) {
            selectedRequestConfig.headers.Cookie = cookieString
        }

        
        return new Promise<void>((resolve, reject) => {
            let isRedirect = false
            axios(selectedRequestConfig)
                .then(response => {
                    const headers = response.headers as AxiosResponseHeaders
                    const foundRedirect = response.data.match(/(?<=Found. Redirecting to )[^<]+/m)

                    if (headers["set-cookie"]) {
                        const cookieStore = new CookieStore({ storeId: key, url: response.config.url! })
                        cookieStore.set(headers["set-cookie"])                        
                        console.log(headers["set-cookie"]);
                        
                    }

                    if (redirectCount[key] < maxRedirect && (headers.location || foundRedirect)) {
                        isRedirect = true
                        redirectCount[key]++
                        return headers.location || foundRedirect[0]
                    }

                    if (resolverAction) {
                        resolverArgs = resolverArgs || {}
                        return resolverAction({ ...resolverArgs, ...{ response: response.data, headers: headers } })
                    }

                    return response.data

                })
                .then(data => {
                    if (isRedirect) {
                        urls[key] = data
                        unFinishedWork.push(key)
                        isRedirect = false
                    } else {
                        result[key] = data
                    }

                    delay = 5000

                    if (unFinishedWork.length > 0 && unFinishedWork.length < workerLimit) {
                        const nextKey = unFinishedWork.shift()
                        if (nextKey) {
                            const nextUrl = urls[nextKey];
                            console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
                            workers.push(fetchData(nextUrl, nextKey))
                        }
                    }
                    resolve()
                })
                .catch(error => {
                    reject(error)
                })
        })
    };

    async function processWorkers(works: Record<string, string>) {

        try {

            if (isInit) {
                unFinishedWork = Object.keys(urls);
                isInit = false
            }

            const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);

            for (let i = 0; i < concurrencyLimit; i++) {
                const key = unFinishedWork.shift();

                if (key) {
                    workers.push(fetchData(works[key], key));
                }
                console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);

            }

            await Promise.all(workers)
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
                setTimeout(async () => {
                    try {
                        const response = await worker({
                            urls: failedUrls,
                            direct: direct,
                            resolverAction: resolverAction,
                            resolverArgs: resolverArgs,
                            requestConfig: requestConfig
                        })
                        resolve(response)
                    } catch (error) {
                        reject(error)
                    }

                }, delay);

            })

            for (const key in response) {
                result[key] = response[key]
            }
        }
    }

    await processWorkers(urls)

    return result;
}