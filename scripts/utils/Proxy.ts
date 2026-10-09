import tls from "node:tls";
import { Agent as HttpsAgent } from "node:https";
import { serverList } from "./serverList";

interface ConnectionOptions {
    host: string;
    port?: number;
}

const serVerCreds = JSON.parse(process.env.Proxy_Auth!)

let lastUsed = -1
export function selectKey(list: { keys: string[] }) {
    lastUsed++
    if (lastUsed > list.keys.length - 1) {
        lastUsed = 0
    }
    return list.keys[lastUsed]
}

/**
 * Robust helper to locate an operational TLS proxy endpoint.
 */
async function getProxySocket(): Promise<tls.TLSSocket> {
    console.log(`🌐 NEW IP LOADING... 🌐 \n`);

    const shuffledServerList = [...serverList].sort(() => Math.random() - 0.5);

    for (const server of shuffledServerList) {
        try {
            return await new Promise<tls.TLSSocket>((resolve, reject) => {
                const socket = tls.connect({ host: server, port: 443, servername: server });
                socket.setTimeout(6000);

                socket.on("secureConnect", () => {
                    socket.setTimeout(0);
                    resolve(socket);
                });
                socket.on("timeout", () => {
                    socket.destroy();
                    reject(new Error("Timeout"));
                });
                socket.on("error", (error) => {
                    socket.destroy();
                    reject(error);
                });
            });
        } catch {
            continue;
        }
    }

    throw new Error("Proxy serverlist Exhausted.");
}

/**
 * Custom HTTPS Agent subclass to properly override the createConnection method.
 * Built-in proxy authentication via hardcoded credentials.
 */
export class ProxyAgent extends HttpsAgent {
    // Pre-computed Base64 auth header using your hardcoded credentials
    private readonly authHeader = `Proxy-Authorization: Basic ${selectKey(serVerCreds)}\r\n`;

    // Overriding the class method instead of passing it as a constructor option
    override createConnection(options: any, callback?: (err: Error | null, socket?: any) => void): any {
        const connectionOpts = options as ConnectionOptions;

        getProxySocket()
            .then((proxySocket) => {
                const targetHost = connectionOpts.host;
                const targetPort = connectionOpts.port || 443;

                // Build the HTTP CONNECT request injection string
                const connectRequest = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
                    `Host: ${targetHost}:${targetPort}\r\n` +
                    `Proxy-Connection: Keep-Alive\r\n` +
                    this.authHeader +
                    `\r\n`;

                proxySocket.write(connectRequest);

                let connectResponse = "";
                const onData = (chunk: Buffer) => {
                    connectResponse += chunk.toString("utf8");
                    if (connectResponse.includes("\r\n\r\n")) {
                        proxySocket.off("data", onData);
                        if (connectResponse.startsWith("HTTP/1.1 200") || connectResponse.startsWith("HTTP/1.0 200")) {
                            const secureTargetSocket = tls.connect({
                                socket: proxySocket,
                                servername: targetHost
                            });

                            secureTargetSocket.on("secureConnect", () => {
                                if (callback) callback(null, secureTargetSocket);
                            });
                            secureTargetSocket.on("error", (err) => {
                                if (callback) callback(err);
                            });
                        } else {

                            if (callback) callback(new Error(`Proxy handshake failed:\n${connectResponse}`));
                        }
                    }
                };
                proxySocket.on("data", onData);
            })
            .catch((err) => {
                if (callback) callback(err);
            });

        return null as any;
    }
}