export interface CookieDetails {
    value: string;
    attributes: Record<string, string | boolean>;
}

export interface PathMap {
    [path: string]: {
        [cookieName: string]: CookieDetails;
    };
}

export interface DomainMap {
    [domain: string]: PathMap;
}

export interface StoreStructure {
    [storeId: string]: DomainMap;
}

export class CookieStore {
    private static globalStore: StoreStructure = {};
    public cookies: { [cookieName: string]: CookieDetails } = {}
    private url: string
    private path: string
    private domain: string
    private storeId: string

    constructor({ storeId, url }: { storeId: string, url: string }) {
        this.storeId = storeId
        this.url = url
        let domainMap = CookieStore.globalStore[this.storeId] || null
        this.domain = this.getRootDomainFromUrl()
        let pathMap = null
        this.path = this.getDefaultCookiePath()

        if (!domainMap) {
            CookieStore.globalStore[this.storeId] = {}
            CookieStore.globalStore[this.storeId][this.domain] = {}
            CookieStore.globalStore[this.storeId][this.domain][this.path] = {}
            domainMap = CookieStore.globalStore[this.storeId]
            pathMap = domainMap[this.domain]
        }

        pathMap = domainMap[this.domain]
        if (!pathMap) {
            CookieStore.globalStore[this.storeId][this.domain][this.path] = {}
            pathMap = domainMap[this.domain]

        }

        this.cookies = pathMap[this.path]
    }


    private getDefaultCookiePath(): string {
        try {
            const url = new URL(this.url);
            const pathname = url.pathname;

            if (!pathname || pathname === '/' || !pathname.startsWith('/')) {
                return '/';
            }

            const lastSlashIndex = pathname.lastIndexOf('/');

            if (lastSlashIndex === 0) {
                return '/';
            }

            return pathname.substring(0, lastSlashIndex);
        } catch {
            return '/';
        }
    }


    /**
 * Detects the default cookie path from a URL based on RFC 6265.
 */
    private getRootDomainFromUrl(): string {
        try {
            const hostname: string = this.url.includes('://')
                ? new URL(this.url).hostname
                : this.url.split(':')[0];

            const parts: string[] = hostname.split('.');
            if (parts.length <= 2) {
                return hostname;
            }

            const tld = parts[parts.length - 1];
            const secondLevel = parts[parts.length - 2];

            const isLikelyMultiPartCcTld =
                tld.length === 2 &&
                ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'mil', 'asn', 'id'].includes(secondLevel.toLowerCase());

            if (isLikelyMultiPartCcTld && parts.length >= 3) {
                return parts.slice(-3).join('.');
            }

            return parts.slice(-2).join('.');
        } catch {
            throw new Error("Domain Not Found");
        }
    }

    /**
     * Parses a Set-Cookie string and saves it using the instance's context.
     */
    public set(cookie: string[]): { [cookieName: string]: CookieDetails } {
        for (let i = 0; i < cookie.length; i++) {
            const cookieString = cookie[i];
            const parts: string[] = cookieString.split(';');
            const mainPart: string = parts[0].trim();

            if (mainPart.indexOf('=') === -1) {
                console.log(`THISSSSSSSSSSSS`);
                throw new Error("Could Not Parse Cookie");
            }

            const [name, value] = mainPart.split("=")

            let explicitDomain: string | null = null;
            let cookiePath: string = this.path;
            const attributes: Record<string, string | boolean> = {};

            for (let i = 1; i < parts.length; i++) {
                const part: string = parts[i].trim();


                if (part.indexOf('=') === -1) {
                    const [name, value] = part.split('=')

                    switch (name.toLowerCase()) {
                        case 'domain':
                            explicitDomain = value.startsWith('.') ? value.substring(1) : value
                            break;

                        case 'path':
                            cookiePath = value
                            break;
                        default:
                            attributes[name] = value
                    }
                } else {
                    attributes[part.toLowerCase()] = true;
                }
            }

            const finalDomain = explicitDomain || this.domain;

            console.log(finalDomain);
            console.log(cookiePath);
            
            CookieStore.globalStore[this.storeId][finalDomain][cookiePath][name] = {
                value,
                attributes
            }            

        }
        // this.cookies = CookieStore.globalStore[this.storeId][this.domain][this.path]

        return this.cookies
    }

    /**
     * Retrieves cookies using the instance's context parameters.
     */
    public get({ cookieName, parse }: { cookieName?: string, parse?: boolean }): CookieDetails | { [cookieName: string]: CookieDetails } | null | string[] {
        console.log(`THIS IS `);
        ; console.log(this.getRootDomainFromUrl());

        console.log(this.path);

        console.log(CookieStore.globalStore[this.storeId][this.domain]);
        const matchedPaths: string[] = []
        const matchedDomains: string[] = []
        const cookieDomains = Object.keys(CookieStore.globalStore[this.storeId])

        for (let i = 0; i < cookieDomains.length; i++) {
            const domain = cookieDomains[i]
            const cookiePaths = Object.keys(CookieStore.globalStore[this.storeId][domain])

            const pattern = new RegExp(`${domain}.`)
            if (domain === this.domain || pattern.test(domain)) {
                for (let j = 0; j < cookiePaths.length; j++) {
                    const path = cookiePaths[j]
                    if (path === '/') {
                        matchedPaths.push(path)
                        matchedDomains.push(domain)
                    }
                }
            }


        }

        if (!parse) {
            if (!cookieName) {
                const cookies: string[] = []

                for (let i = 0; i < matchedDomains.length; i++) {
                    const domain = matchedDomains[i]
                    const path = matchedPaths[i]

                    for (const cookieName in CookieStore.globalStore[this.storeId][domain][path]) {
                        const cookie = CookieStore.globalStore[this.storeId][domain][path][cookieName]
                        const cookieString = `${cookieName}=${cookie.value}`
                        cookies.push(cookieString)
                    }
                }
                // for (let j = 0; j < cookieDomains.length; j++) {
                //     const domain = cookieDomains[j]
                //     for (const cookieName in CookieStore.globalStore[this.storeId][domain][this.path]) {
                //         const cookie = CookieStore.globalStore[this.storeId][domain][this.path][cookieName]
                //         const cookieString = `${cookieName}=${cookie.value}`
                //         cookies.push(cookieString)
                //     }
                // }

                return cookies
            } else {
                for (let i = 0; i < matchedDomains.length; i++) {
                    const domain = matchedDomains[i]
                    const path = matchedPaths[i]

                    const cookie = CookieStore.globalStore[this.storeId][domain][path][cookieName] || null
                    if (cookie) {
                        const cookieString = `${cookieName}=${cookie.value}`
                        return [cookieString]
                    }
                }
                return null
            }

        } else {
            for (let i = 0; i < matchedDomains.length; i++) {
                const domain = matchedDomains[i]
                const path = matchedPaths[i]

                if (!cookieName) {
                    return CookieStore.globalStore[this.storeId][domain][path]
                } else {
                    const cookie = CookieStore.globalStore[this.storeId][domain][path][cookieName]
                    if (cookie) {
                        return cookie
                    }
                }
            }
            return null
        }
    }
}