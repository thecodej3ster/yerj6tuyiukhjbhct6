import tls from "node:tls";
import { Agent as HttpsAgent } from "node:https";
import fs from 'fs/promises'
import path from "node:path";

// import { serverList } from "./serverList";

let serverList: { servers: { host: string, auth: string }[] }

interface ConnectionOptions {
    host: string;
    port?: number;
}

// const serVerCreds = JSON.parse(process.env.Proxy_Auth!)

// const serVerCreds = {
//     keys: [
//         // "ZTdoNjkwc3ItemVxZzNicDpyc2Z2YWVnbTZq",
//         "NDdxeHdhNTYtN3dlM3Q5ajp4ajkzcnE3ZGV2",
//         "M2ptbTVsc3UteHpiNTZqcDphanNnY2Y4ZGht",
//         "NnI0OGJ2MjktdjdjMjY1ZTp1bnZ4NWV6OTg2",
//         "d3I2OGtlNnktMnhjczM2cDpkanlna3Nobjd1",
//         "ZDd2Y2M0NnYtZ2J2dXNkZjplcnFiMnpqZGF0"
//     ]
// }

let selectedServer: { host: string, auth: string }




let lastUsed = -1
export function selectKey(list: { keys: string[] }) {
    lastUsed++
    if (lastUsed > list.keys.length - 1) {
        lastUsed = 0
    }
    return list.keys[lastUsed]
}

// console.log(`Proxy-Authorization: Basic ${selectKey(serVerCreds)}\r\n`);

/**
 * Robust helper to locate an operational TLS proxy endpoint.
 */
async function getProxySocket(): Promise<tls.TLSSocket> {
    console.log(`🌐 NEW IP LOADING... 🌐 \n`);

    const serverListPath = path.resolve(path.join(__dirname,"serverList.json"))
    const serverListFIle = await fs.readFile(serverListPath)
    serverList = JSON.parse(serverListFIle.toString())

    const shuffledServerList = [...serverList.servers].sort(() => Math.random() - 0.5);

    for (const server of shuffledServerList) {
        selectedServer = server
        try {
            return await new Promise<tls.TLSSocket>((resolve, reject) => {
                const socket = tls.connect({ host: server.host, port: 443, servername: server.host });

                // const socket = tls.connect({ host: server, port: 443, servername: server });
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
    private authHeader = "";


    // Overriding the class method instead of passing it as a constructor option
    override createConnection(options: any, callback?: (err: Error | null, socket?: any) => void): any {
        const connectionOpts = options as ConnectionOptions;

        getProxySocket()
            .then((proxySocket) => {
                this.authHeader = `Proxy-Authorization: Basic ${selectedServer.auth}\r\n`
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