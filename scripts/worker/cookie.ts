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

const IPV4_REGEX =
    /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const IPV6_REGEX =
    /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::|(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))$/i;

function isIpWithRegex(host: string): boolean {
    const normalized = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
    return IPV4_REGEX.test(normalized) || IPV6_REGEX.test(normalized);
}

export class CookieStore {
    private static globalStore: StoreStructure = {};
    public cookies: { [cookieName: string]: CookieDetails } = {}
    private url: string
    private path: string
    private hostname: string
    private domain: string
    private storeId: string

    constructor({ storeId, url }: { storeId: string, url: string }) {
        this.storeId = storeId
        this.url = url
        this.hostname = this.getHostnameFromUrl()
        this.domain = this.getRootDomainFromUrl()
        this.path = this.getDefaultCookiePath()

        CookieStore.globalStore[this.storeId] ??= {}
        CookieStore.globalStore[this.storeId][this.domain] ??= {}
        CookieStore.globalStore[this.storeId][this.domain][this.path] ??= {}

        this.cookies = CookieStore.globalStore[this.storeId][this.domain][this.path]
    }

    private getHostnameFromUrl(): string {
        try {
            const rawHost = this.url.includes('://')
                ? new URL(this.url).hostname
                : this.url.split('/')[0].split(':')[0];
            return rawHost.toLowerCase().replace(/\.$/, '');
        } catch {
            throw new Error("Domain Not Found");
        }
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
            const hostname = this.hostname;
            if (!hostname) {
                throw new Error("Domain Not Found");
            }

            if (isIpWithRegex(hostname)) {
                return hostname;
            }

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

    private pathMatches(requestPath: string, cookiePath: string): boolean {
        const reqP = requestPath.startsWith('/') ? requestPath : '/';
        const domP = cookiePath.startsWith('/') ? cookiePath : '/';

        if (reqP === domP) return true;
        if (domP === '/') return true;
        if (domP.endsWith('/') && reqP.startsWith(domP)) return true;
        if (reqP.startsWith(`${domP}/`)) return true;

        return false;
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
            let cookiePath: string = '/';
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
                            explicitDomain = attrValue.replace(/^\.+|\.+$/g, '').toLowerCase();
                            break;
                        case 'path':
                            cookiePath = attrValue.startsWith('/') ? attrValue : '/';
                            break;
                        default:
                            attributes[attrName] = attrValue;
                    }
                } else {
                    attributes[part.toLowerCase()] = true;
                }
            }

            const isHostOnly = !explicitDomain;
            attributes.__hostOnly = isHostOnly;

            const finalDomain = (explicitDomain || this.hostname).toLowerCase();

            CookieStore.globalStore[this.storeId] ??= {};
            CookieStore.globalStore[this.storeId][finalDomain] ??= {};
            CookieStore.globalStore[this.storeId][finalDomain][cookiePath] ??= {};

            CookieStore.globalStore[this.storeId][finalDomain][cookiePath][name] = {
                value,
                attributes
            };
        }

        this.cookies =
            CookieStore.globalStore[this.storeId]?.[this.domain]?.[this.path]
            ?? CookieStore.globalStore[this.storeId]?.[this.hostname]?.[this.path]
            ?? {};
    }

    private getCookieOwner() {
        const matchedPaths: string[] = []
        const matchedDomains: string[] = []
        const storeDomains = CookieStore.globalStore[this.storeId] || {}
        const cookieDomains = Object.keys(storeDomains)

        const domainMatches = ({ requestHost, cookieDomain, hostOnly }: { requestHost: string, cookieDomain: string, hostOnly: boolean }) => {
            const req = requestHost.toLowerCase().replace(/\.$/, '');
            const dom = cookieDomain.toLowerCase().replace(/^\.+|\.+$/g, '');
            if (!req || !dom) return false;
            if (req === dom) return true;
            if (hostOnly || isIpWithRegex(req)) return false;
            return req.endsWith(`.${dom}`);
        }

        for (let i = 0; i < cookieDomains.length; i++) {
            const domain = cookieDomains[i]
            const cookiePaths = Object.keys(storeDomains[domain])

            for (let j = 0; j < cookiePaths.length; j++) {
                const path = cookiePaths[j]
                const pathBucket = storeDomains[domain][path]
                const cookieEntries = Object.values(pathBucket)
                const isHostOnlyBucket =
                    cookieEntries.length > 0 &&
                    cookieEntries.every((c) => c.attributes?.__hostOnly === true)

                if (domainMatches({ requestHost: this.hostname, cookieDomain: domain, hostOnly: isHostOnlyBucket })) {
                    if (this.pathMatches(this.path, path)) {
                        matchedPaths.push(path)
                        matchedDomains.push(domain)
                    }
                }
            }
        }

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
                    const bucket = CookieStore.globalStore[this.storeId]?.[domain]?.[path] || {}

                    for (const name in bucket) {
                        const cookie = bucket[name]
                        const cookieString = `${name}=${cookie.value}`
                        cookies.push(cookieString)
                    }
                }

                return cookies
            } else {
                for (let i = 0; i < matchedDomains.length; i++) {
                    const domain = matchedDomains[i]
                    const path = matchedPaths[i]
                    const cookie = CookieStore.globalStore[this.storeId]?.[domain]?.[path]?.[cookieName]
                    if (cookie) {
                        return [`${cookieName}=${cookie.value}`]
                    }
                }
                return null
            }

        } else {
            const cookies: { [cookieName: string]: CookieDetails } = {}

            if (!cookieName) {
                for (let i = 0; i < matchedDomains.length; i++) {
                    const domain = matchedDomains[i]
                    const path = matchedPaths[i]
                    const bucket = CookieStore.globalStore[this.storeId]?.[domain]?.[path] || {}

                    for (const name in bucket) {
                        cookies[name] = bucket[name]
                    }
                }

                return cookies
            } else {
                for (let i = 0; i < matchedDomains.length; i++) {
                    const domain = matchedDomains[i]
                    const path = matchedPaths[i]
                    const cookie = CookieStore.globalStore[this.storeId]?.[domain]?.[path]?.[cookieName]
                    if (cookie) {
                        return cookie
                    }
                }
            }
            return null
        }
    }
}