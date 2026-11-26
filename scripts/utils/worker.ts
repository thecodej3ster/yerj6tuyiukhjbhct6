import axios, { RawAxiosRequestConfig, AxiosResponseHeaders } from "axios";
import { ProxyAgent } from "./proxy/Proxy";
import { WorkerConfig } from "./types";
import { CookieStore } from "./cookie";
import crypto from "crypto";

const workerLimit = 5;
const result: Record<string, any> = {};
const redirectCount: Record<string, number> = {};
let maxRedirect = 0;
let delay = 0;

export async function worker({ requestConfig, direct, urls, resolverAction, resolverArgs }: WorkerConfig) {
    let failedWorks: string[] = [];
    let sucessfulWorks: string[] = [];
    let totalWork = 0;
    let activeWorkers = 0;
    let unFinishedWork: string[] = [];
    const redirects: Record<string, string> = {};
    let workerProcesses = Promise.withResolvers<string>();

    const incomingHeaders = requestConfig?.headers
        ? (requestConfig.headers instanceof Headers
            ? Object.fromEntries(requestConfig.headers.entries())
            : requestConfig.headers)
        : {};

    if (requestConfig?.maxRedirects !== undefined) {
        maxRedirect = requestConfig.maxRedirects;
    }

    const resolveUrl = (base: string, target: string) => {
        try {
            return new URL(target, base).toString();
        } catch {
            return target;
        }
    };


    const decodeHtmlEntities = (str: string): string => {
        const HTML_ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", }
        return str.replace(/&(?:amp|lt|gt|quot|#39|#x27);|&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
            if (dec) return String.fromCharCode(Number(dec));
            if (hex) return String.fromCharCode(parseInt(hex, 16));
            return HTML_ENTITIES[match] ?? match;
        });
    }

    const fetchData = (url: string, key: string) => {
        activeWorkers++;
        const mainKey = Object.keys(redirects).includes(key) ? redirects[key] : key;
        const resolvedUrl = resolveUrl(urls[mainKey] || url, url);

        if (!redirectCount[mainKey]) {
            redirectCount[mainKey] = 0;
        }

        const selectedRequestConfig: RawAxiosRequestConfig & { body?: any } = {
            url: resolvedUrl,
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
            validateStatus: (status) => status < 400 && status > 199,
        };

        if (selectedRequestConfig.body) {
            delete selectedRequestConfig.body;
        }

        if (!direct) {
            selectedRequestConfig.httpsAgent = new ProxyAgent({ keepAlive: true });
        }

        const cookieStore = new CookieStore({ storeId: mainKey, url: resolvedUrl });
        const cookie = cookieStore.get({}) as string[];
        const cookieString = cookie.join(";");

        if (selectedRequestConfig.headers && cookieString) {
            selectedRequestConfig.headers.Cookie = cookieString;
        }

        let isRedirect = false;

        axios(selectedRequestConfig)
            .then((response) => {
                console.log(response);

                let foundRedirect: RegExpMatchArray | null = null;
                const headers = response.headers as AxiosResponseHeaders;
                const currentUrl = response.config.url ? resolveUrl(resolvedUrl, response.config.url) : resolvedUrl;

                if (selectedRequestConfig.responseType === "text" && typeof response.data === "string") {
                    foundRedirect = response.data.match(/(?<=Found\. Redirecting to )[^<]+/m);
                    console.log(foundRedirect);
                }

                if (headers["set-cookie"]) {
                    const resCookieStore = new CookieStore({ storeId: mainKey, url: currentUrl });
                    resCookieStore.set(
                        Array.isArray(headers["set-cookie"]) ? headers["set-cookie"] : [headers["set-cookie"]]
                    );
                }

                const rawRedirect = foundRedirect?.length ? decodeHtmlEntities(foundRedirect[0]).trim() : headers.location;
                if (redirectCount[mainKey] < maxRedirect && rawRedirect) {
                    isRedirect = true;
                    redirectCount[mainKey]++;
                    return resolveUrl(currentUrl, rawRedirect);
                }

                if (resolverAction) {
                    resolverArgs = resolverArgs || {};
                    redirectCount[mainKey] = 0;
                    return resolverAction({
                        ...resolverArgs,
                        response: response.data,
                        headers,
                        key: mainKey,
                        url: resolvedUrl,
                    });
                }

                redirectCount[mainKey] = 0;
                return response.data;
            })
            .then((data) => {
                if (isRedirect) {
                    const redirectKey = crypto.randomBytes(8).toString("hex");
                    urls[redirectKey] = data;
                    redirects[redirectKey] = mainKey;
                    unFinishedWork.push(redirectKey);
                } else {
                    result[mainKey] = data;
                    if (!sucessfulWorks.includes(mainKey)) {
                        sucessfulWorks.push(mainKey);
                    }
                    failedWorks = failedWorks.filter((work) => work !== mainKey);
                }
            })
            .catch((error) => {
                let payload: any = error.response;

                if (error.response) {
                    payload = error.response.data !== undefined ? error.response.data : error.response;
                    payload = typeof payload === "object"
                        ? `Server Responded with Status: ${error.response.status}\n${JSON.stringify(payload)}`
                        : `Server Responded with Status: ${error.response.status}\n${payload}`;
                } else {
                    payload = error.request
                        ? `Request Failed With No Response:\n${error.message}`
                        : `Unable To Make Request:\n${error.message}`;
                }

                result[mainKey] = payload;

                if (!failedWorks.includes(mainKey)) {
                    failedWorks.push(mainKey);
                }
                sucessfulWorks = sucessfulWorks.filter((work) => work !== mainKey);
            })
            .finally(() => {
                activeWorkers--;

                if (unFinishedWork.length > 0) {
                    const nextKey = unFinishedWork.shift();
                    if (nextKey) {
                        fetchData(urls[nextKey], nextKey);
                    }
                }

                if (activeWorkers === 0 && unFinishedWork.length === 0) {
                    if (failedWorks.length > 0) {
                        delay = Math.min(delay + 5000, 30000);
                    }
                    workerProcesses.resolve("Workers Done");
                }
            });
    };

    async function processWorkers(works: Record<string, string>) {
        try {
            unFinishedWork = Object.keys(works);
            totalWork = unFinishedWork.length;

            const concurrencyLimit = Math.min(workerLimit, unFinishedWork.length);
            if (!unFinishedWork.length) return;

            for (let i = 0; i < concurrencyLimit; i++) {
                const key = unFinishedWork.shift()!;
                fetchData(works[key], key);
            }

            await workerProcesses.promise;

            if (failedWorks.length) {
                throw new Error("Failed Works Available");
            }
        } catch (error) {
            const failedUrls: Record<string, string> = {};

            for (const key of failedWorks) {
                if (delay >= 30000) {
                    console.log(result[key]);
                    continue;
                }
                failedUrls[key] = urls[key];
            }

            if (delay >= 30000 || Object.keys(failedUrls).length === 0) {
                throw error;
            }

            const response = await new Promise<Record<string, any>>((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        const res = await worker({
                            urls: failedUrls,
                            direct,
                            resolverAction,
                            resolverArgs,
                            requestConfig,
                        });
                        resolve(res);
                    } catch (err) {
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