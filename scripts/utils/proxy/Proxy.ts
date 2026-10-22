import tls from "node:tls";
import { Agent as HttpsAgent } from "node:https";
import { setProxyCreds } from "./update";
import path from "path";
import fs from 'fs'

interface ConnectionOptions {
    host: string;
    port?: number;
}


interface ServerCred {
    host: string
    auth: string
}

let selectedServer: ServerCred
const serverListPath = path.resolve("scripts/utils/proxy/serverList.json")
let serverListFile = fs.readFileSync(serverListPath, "utf-8")
let serverList: { servers: ServerCred[] } = JSON.parse(serverListFile)



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

function buildConnectRequst({ authHeader, targetHost, targetPort }: { authHeader: string, targetHost: string, targetPort: number }) {
    return `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
        `Host: ${targetHost}:${targetPort}\r\n` +
        `Proxy-Connection: Keep-Alive\r\n` +
        authHeader +
        `\r\n`;
}

/**
 * Custom HTTPS Agent subclass to properly override the createConnection method.
 * Built-in proxy authentication via hardcoded credentials.
 */
let retried = false
export class ProxyAgent extends HttpsAgent {

    // Overriding the class method instead of passing it as a constructor option
    override createConnection(options: any, callback?: (err: Error | null, socket?: any) => void): any {
        const connectionOpts = options as ConnectionOptions;
        let connectResponse = "";
        let connectRetry = 0
        const hanleRequest = async () => {
            const proxySocket = await getProxySocket()
            proxySocket.setTimeout(60000)

            proxySocket.on("timeout", async () => {
                console.log('TIMEOUT...');

                proxySocket.destroy();
                connectResponse = ""
                try {
                    connectRetry++
                    await hanleRequest()
                } catch (error) {
                    if (connectRetry === 3) {
                        throw new Error('Connection Timed Out')
                    }
                    await hanleRequest()
                }
            })

            const authHeader = `Proxy-Authorization: Basic ${selectedServer.auth}\r\n`
            const targetHost = connectionOpts.host;
            const targetPort = connectionOpts.port || 443;

            // Build the HTTP CONNECT request injection string
            const connectRequest = buildConnectRequst({ authHeader: authHeader, targetHost: targetHost, targetPort: targetPort })

            proxySocket.write(connectRequest);

            const onData = async (chunk: Buffer) => {
                connectResponse += chunk.toString("utf8");

                if (connectResponse.includes("\r\n\r\n")) {
                    switch (true) {
                        case connectResponse.startsWith("HTTP/1.1 200"):
                        case connectResponse.startsWith("HTTP/1.0 200"):
                            proxySocket.off("data", onData);
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
                            break;

                        case connectResponse.startsWith("HTTP/1.0 407") && !retried:
                        case connectResponse.startsWith("HTTP/1.1 407") && !retried:
                            await setProxyCreds()
                            serverListFile = fs.readFileSync(serverListPath, "utf-8")
                            serverList = JSON.parse(serverListFile)
                            for (let i = 0; i < serverList.servers.length; i++) {
                                const server = serverList.servers[i];
                                if (server.host === selectedServer.host) {
                                    selectedServer.auth = server.auth
                                    const authHeader = `Proxy-Authorization: Basic ${selectedServer.auth}\r\n`
                                    const connectRequest = buildConnectRequst({ authHeader: authHeader, targetHost: targetHost, targetPort: targetPort })
                                    proxySocket.off("data", onData)
                                    connectResponse = ""
                                    proxySocket.on("data", onData)
                                    proxySocket.write(connectRequest)
                                    break
                                }
                            }
                            retried = true
                            break;
                        default:
                            proxySocket.off("data", onData);
                            if (callback) callback(new Error(`Proxy handshake failed:\n${connectResponse}`));

                    }
                }
            };
            proxySocket.on("data", onData);
        }

        hanleRequest()
            .catch((err) => {
                if (callback) callback(err);
            });

        return null as any;
    }
}