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

    public set(cookies: string[]) {
        for (let i = 0; i < cookies.length; i++) {
            const parts = cookies[i].split(';');
            const mainPart = parts[0].trim();

            const eqIndex = mainPart.indexOf('=');
            if (eqIndex === -1) {
                throw new Error("Could Not Parse Cookie");
            }

            const name = mainPart.slice(0, eqIndex).trim();
            const value = mainPart.slice(eqIndex + 1).trim();

            let explicitDomain: string | null = null;
            let cookiePath: string = this.path;
            const attributes: Record<string, string | boolean> = {};

            for (let j = 1; j < parts.length; j++) {
                const part = parts[j].trim();
                if (!part) continue;

                const attrEqIndex = part.indexOf('=');
                if (attrEqIndex !== -1) {
                    const attrName = part.slice(0, attrEqIndex).trim().toLowerCase();
                    const attrValue = part.slice(attrEqIndex + 1).trim();

                    switch (attrName) {
                        case 'domain':
                            explicitDomain = attrValue.startsWith('.')
                                ? attrValue.slice(1).toLowerCase()
                                : attrValue.toLowerCase();
                            break;
                        case 'path':
                            cookiePath = attrValue || '/';
                            break;
                        default:
                            attributes[attrName] = attrValue;
                    }
                } else {
                    attributes[part.toLowerCase()] = true;
                }
            }

            const finalDomain = (explicitDomain || this.domain).toLowerCase();

            CookieStore.globalStore[this.storeId] ??= {};
            CookieStore.globalStore[this.storeId][finalDomain] ??= {};
            CookieStore.globalStore[this.storeId][finalDomain][cookiePath] ??= {};

            CookieStore.globalStore[this.storeId][finalDomain][cookiePath][name] = {
                value,
                attributes
            };
        }

        this.cookies =
            CookieStore.globalStore[this.storeId]?.[this.domain.toLowerCase()]?.[this.path] ?? {};
    }

    private getCookieOwner() {
        const matchedPaths: string[] = []
        const matchedDomains: string[] = []
        const cookieDomains = Object.keys(CookieStore.globalStore[this.storeId])

        for (let i = 0; i < cookieDomains.length; i++) {
            const domain = cookieDomains[i]
            const cookiePaths = Object.keys(CookieStore.globalStore[this.storeId][domain])
            console.log(cookiePaths);

            if (domain === this.domain || this.domain.includes(domain)) {
                for (let j = 0; j < cookiePaths.length; j++) {
                    const path = cookiePaths[j]
                    if (path === "/auth/oidc") {
                        console.log("AM HEREEEEEEEEEE");
                    }

                    if (path === '/' || path.startsWith(this.path) || this.path.startsWith(path)) {
                        matchedPaths.push(path)
                        matchedDomains.push(domain)
                    } else {
                        if (path === "/auth/oidc") {
                            console.log("AM NOTTTTT HEREEEEEEEEEE");
                        }
                    }
                }
            } else {
                console.log(`THIS IS ${this.domain} ...`);
                console.log(`I AM FOR DOMAIN ${domain} ...`);
            }


        }
        console.log(matchedDomains, matchedPaths);

        return { matchedPaths: matchedPaths, matchedDomains: matchedDomains }
    }

    /**
     * Retrieves cookies using the instance's context parameters.
     */
    public get({ cookieName, parse }: { cookieName?: string, parse?: boolean }): CookieDetails | { [cookieName: string]: CookieDetails } | null | string[] {

        const { matchedDomains, matchedPaths } = this.getCookieOwner()

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
                if (this.url === 'https://graph.buffer.com/?_o=getPersonalAccessTokens') {
                    // console.log(cookies);
                }
                return cookies
            } else {
                const cookie = CookieStore.globalStore[this.storeId][matchedDomains[0]][matchedPaths[0]][cookieName] || null
                if (cookie) {
                    const cookieString = `${cookieName}=${cookie.value}`
                    return [cookieString]
                }
                return null
            }

        } else {
            const cookies: { [cookieName: string]: CookieDetails } = {}

            if (!cookieName) {
                for (let i = 0; i < matchedDomains.length; i++) {
                    const domain = matchedDomains[i]
                    const path = matchedPaths[i]

                    for (const cookieName in CookieStore.globalStore[this.storeId][domain][path]) {
                        cookies[cookieName] = CookieStore.globalStore[this.storeId][domain][path][cookieName]

                    }
                }

                return cookies
            } else {
                const cookie = CookieStore.globalStore[this.storeId][matchedDomains[0]][matchedPaths[0]][cookieName]
                if (cookie) {
                    return cookie
                }
            }
            return null
        }
    }
}