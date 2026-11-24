import axios, { RawAxiosRequestConfig, AxiosResponseHeaders } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";
import { CookieStore } from "./cookie";
import crypto from 'crypto'

const workerLimit = 5
const result: Record<string, any> = {};
const redirectCount: Record<string, number> = {}
let maxRedirect = 0
let delay = 0

export async function worker({ requestConfig, direct, urls, resolverAction, resolverArgs }: WorkerConfig) {
    let failedWorks: string[] = []
    let sucessfulWorks: string[] = []
    let totalWork = 0
    let unFinishedWork: string[] = []
    const redirects: Record<string, string> = {}
    const workerProcesses = Promise.withResolvers()

    const incomingHeaders = requestConfig?.headers
        ? (requestConfig.headers instanceof Headers
            ? Object.fromEntries(requestConfig.headers.entries())
            : requestConfig.headers)
        : {};

    if (requestConfig?.maxRedirects) {
        maxRedirect = requestConfig.maxRedirects
        requestConfig.maxRedirects = 0
    }

    const fetchData = (url: string, key: string) => {
        let mainKey = Object.keys(redirects).includes(key) ? redirects[key] : key

        if (!redirectCount[mainKey]) {
            redirectCount[mainKey] = 0
        }

        const selectedRequestConfig: RawAxiosRequestConfig & { body?: any } = {
            url: url,
            method: "GET",
            responseEncoding: "utf-8",
            responseType: "text",
            ...requestConfig,
            data: requestConfig?.body || null,
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
            maxRedirects: 0,
            validateStatus: (status) => status < 400 && status > 199
        }

        if (selectedRequestConfig.body) {
            delete selectedRequestConfig.body
        }

        if (!direct) {
            selectedRequestConfig.httpsAgent = new ProxyAgent({ keepAlive: true })
        }

        const cookieStore = new CookieStore({ storeId: mainKey, url: url })
        const cookie = cookieStore.get({}) as string[]
        if (redirectCount[mainKey] > 0) {
            console.log(cookie);
        }

        const cookieString = cookie.join(';')

        if (selectedRequestConfig.headers) {
            selectedRequestConfig.headers.Cookie = cookieString
        }

        let isRedirect = false
        axios(selectedRequestConfig)
            .then(response => {
                console.log(response);

                let foundRedirect = null
                const headers = response.headers as AxiosResponseHeaders

                if (selectedRequestConfig.responseType === 'text') {
                    foundRedirect = response.data.match(/(?<=Found. Redirecting to )[^<]+/m)
                }

                if (headers["set-cookie"]) {
                    const cookieStore = new CookieStore({ storeId: mainKey, url: response.config.url! })
                    cookieStore.set(headers["set-cookie"])
                }

                if ((redirectCount[mainKey] < maxRedirect) && (headers.location || foundRedirect)) {
                    isRedirect = true
                    redirectCount[mainKey]++
                    const redirectUrl = foundRedirect?.length ? foundRedirect[0] : headers.location
                    console.log('REDIRECT DETECTED ...')
                    return redirectUrl
                }

                if (resolverAction) {
                    resolverArgs = resolverArgs || {}
                    redirectCount[mainKey] = 0
                    return resolverAction({
                        ...resolverArgs,
                        ...{
                            response: response.data,
                            headers: headers,
                            key: mainKey,
                            url: url
                        }
                    })
                }
                return response.data

            })
            .then(data => {
                const redirectKey = crypto.randomBytes(8).toString("hex")
                if (isRedirect) {
                    urls[redirectKey] = data
                    redirects[redirectKey] = mainKey
                    unFinishedWork.push(redirectKey)
                    isRedirect = false
                    console.log('REDIRECTING ...');
                } else {
                    result[mainKey] = data
                    if (!sucessfulWorks.includes(mainKey)) {
                        sucessfulWorks.push(mainKey)
                    }
                    failedWorks = failedWorks.filter(work => work !== mainKey)
                }

                if (unFinishedWork.length > 0) {
                    const nextKey = unFinishedWork.shift()
                    if (nextKey) {
                        const nextUrl = urls[nextKey];
                        console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
                        fetchData(nextUrl, nextKey)
                    }
                }
            })
            .catch((error) => {
                let payload = error.response

                if (error.response) {
                    payload = error.response.data ? error.response.data : error.response

                    if (typeof payload === 'object') {
                        payload = `Server Responded with Status: ${error.response.status}\n${JSON.stringify(payload)}`
                    } else {
                        payload = `Server Responded with Status: ${error.response.status}\n${payload}`
                    }

                } else {
                    payload = error.request ? `Request Failed With No Response:\n${error.message}` : `Unable To Make Request:\n${error.message}`
                }

                result[mainKey] = payload

                if (!failedWorks.includes(mainKey)) {
                    failedWorks.push(mainKey)
                }
                sucessfulWorks = sucessfulWorks.filter(work => work !== mainKey)
            })
            .finally(() => {

                if ((sucessfulWorks.length + failedWorks.length) === totalWork) {
                    if (failedWorks.length === totalWork) {
                        delay += 5000
                    } else {
                        delay = 5000
                    }
                    workerProcesses.resolve("Workers Done")
                }
            })
    };

    async function processWorkers(works: Record<string, string>) {

        try {
            unFinishedWork = Object.keys(urls);
            totalWork = unFinishedWork.length

            const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);

            for (let i = 0; i < concurrencyLimit; i++) {
                const key = unFinishedWork.shift();

                if (key) {
                    fetchData(works[key], key)
                }
                console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);

            }

            await workerProcesses.promise

            if (failedWorks.length) {
                console.log(failedWorks);
                
                // throw new Error("Failed Works Available");
            }
        } catch (error) {
            console.log('REQUEST FAILED RETRYING ...')
            const failedUrls: Record<string, string> = {}

            failedWorks.map(key => {
                if (delay === 30000) {
                    console.log(result[key]);
                    return
                }

                failedUrls[key] = urls[key]
            })

            if (delay === 30000) {
                throw error
            }
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
                        console.log('I REJECTED');

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