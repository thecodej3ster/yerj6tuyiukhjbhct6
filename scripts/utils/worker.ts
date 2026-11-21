import axios, { RawAxiosRequestConfig, AxiosResponseHeaders } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";
import { CookieStore } from "./cookie";

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
        if (!redirectCount[key]) {
            redirectCount[key] = 0
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
        if (url === 'https://graph.buffer.com/?_o=getPersonalAccessTokens') {

            const u = cookieStore.get({ parse: true })

            if (u) {
                // console.log('WORKER IS RECIVING ...');
                // console.log(u);
                // console.log('COOKIE IS RECIVING ...');
                // console.log(cookie);
                // const y = cookie.join(';')
                // console.log(y);
                
                 // if (!Object.keys(u).includes("buffer_access_token")) {
                //     console.log(u)
                //     console.log(key);
                //     console.log('NOT AVAILABLE');
                // }
            }

        }

        const cookieString = cookie.join(';')

        if (selectedRequestConfig.headers) {
                        selectedRequestConfig.headers.Cookie = cookieString

             if (url === 'https://graph.buffer.com/?_o=getPersonalAccessTokens') {
 console.log(cookieString);
 console.log(selectedRequestConfig);
                 console.log(selectedRequestConfig.headers.Cookie.split(';'));

             }
           
            
        }

        let isRedirect = false
        axios(selectedRequestConfig)
            .then(response => {
                const headers = response.headers as AxiosResponseHeaders
                const foundRedirect = response.data.match(/(?<=Found. Redirecting to )[^<]+/m)

                if (headers["set-cookie"]) {
                    const cookieStore = new CookieStore({ storeId: key, url: response.config.url! })
                    cookieStore.set(headers["set-cookie"])
                }

                if (redirectCount[key] === 1) {
                    console.log(foundRedirect);

                }
                if ((redirectCount[key] < maxRedirect) && (headers.location || foundRedirect)) {
                    isRedirect = true
                    redirectCount[key]++
                    const redirectUrl = headers.location || foundRedirect[0]
                    console.log(`REDIRECT COUNT IS: ${redirectCount[key]}`);
                    return redirectUrl
                } else {
                    console.log('REDIRECT LIMIT REACHED ...');

                }

                if (resolverAction) {
                    resolverArgs = resolverArgs || {}
                    redirectCount[key] = 0
                    return resolverAction({
                        ...resolverArgs,
                        ...{
                            response: response.data,
                            headers: headers,
                            key: key,
                            url: url
                        }
                    })
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
                    if (!sucessfulWorks.includes(key)) {
                        sucessfulWorks.push(key)
                    }
                    failedWorks = failedWorks.filter(work => work !== key)
                }

                if (unFinishedWork.length > 0) {
                    console.log('REDIRECTING ...');

                    const nextKey = unFinishedWork.shift()
                    if (nextKey) {
                        const nextUrl = urls[nextKey];
                        console.log(`🔥 WORKER IN PROGRESS ... 🔥\n`);
                        fetchData(nextUrl, nextKey)
                    }
                }
            })
            .catch((error) => {
                if (!failedWorks.includes(key)) {
                    failedWorks.push(key)
                }
                
                let payload = error.response

                if (error.response) {
                    if (error.response.data) {
                        payload = error.response.data
                    } else {
                        payload = error.response
                    }
                    if (typeof payload === 'object') {
                        payload = `Server Responded with Status: ${error.response.status}\n${JSON.stringify(payload)}`
                    } else {
                        payload = `Server Responded with Status: ${error.response.status}\n${payload}`
                    }
                }
                else if (error.request) {
                    payload = `Request Failed With No Response:\n${error.message}`
                }
                else {
                    payload = `Unable To Make Request:\n${error.message}`
                }

                result[key] = payload
                sucessfulWorks = sucessfulWorks.filter(work => work !== key)
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
                throw new Error("Failed Works Available");
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