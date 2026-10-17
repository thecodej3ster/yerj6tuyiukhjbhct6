import { AxiosResponse, AxiosResponseHeaders, RawAxiosRequestConfig } from "axios"

export type RequestConfig = Omit<RawAxiosRequestConfig, "data"> & { body?: any }

export type ResolverArgs = {
    response: any,
    headers: AxiosResponseHeaders
} & Record<string, any>

export type WorkerConfig = {
    urls: Record<string, string>;
    requestConfig?: RequestConfig;
    resolverAction?: (args: ResolverArgs) => Promise<any>;
    resolverArgs?: Record<string, string>;
    direct?: boolean
};

