import { RawAxiosRequestConfig } from "axios"

export type RequestConfig = Omit<RawAxiosRequestConfig, "data"> & { body?: any }


export type WorkerConfig = {
    urls: Record<string, string>;
    requestConfig?: RequestConfig;
    resolverAction?: (args: Record<string, any>) => Promise<any>;
    resolverArgs?: Record<string, string>;
    direct?: boolean
};