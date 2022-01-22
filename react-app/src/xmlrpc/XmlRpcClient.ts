
import { Deserializer } from "./Deserializer";
import { serializeMethodCall } from "./Serializer";
import { XmlRpcFault } from "./XmlRpcFault";
import { XmlRpcStruct, XmlRpcValue, XmlRpcValueOrFault } from "./XmlRpcTypes";

// A client for making XML-RPC method calls over HTTP(S)
export class XmlRpcClient {
  url: string;
  headers = {
    "Content-Type": "text/xml",
    Accept: "text/xml",
  };

  constructor(url: string, options?: { headers?: Record<string, string> }) {
    this.url = url;
    if (options?.headers !== undefined) {
      this.headers = { ...this.headers, ...options.headers };
    }
  }

  // Make an XML-RPC call to the server and return the response
  async methodCall(method: string, params?: XmlRpcValue[]): Promise<XmlRpcValue> {
    const body = serializeMethodCall(method, params);
    const headers = this.headers;

    let res: Response;
    try {
      res = await fetch(this.url, { method: "POST", headers, body });
    } catch (err) {
      if ((err as Error).message === "Failed to fetch") {
        throw new Error(`XML-RPC call "${method}" to ${this.url} failed to connect`);
      }
      throw err;
    }
    if (!res.ok) {
      throw new Error(
        `XML-RPC call "${method}" to ${this.url} returned ${res.status}: "${res.statusText}"`,
      );
    }

    const resText = await res.text();
    const deserializer = new Deserializer();
    return await deserializer.deserializeMethodResponse(resText);
  }

  async multiMethodCall(
    requests: { methodName: string; params: XmlRpcValue[] }[],
  ): Promise<XmlRpcValueOrFault[]> {
    const res = await this.methodCall("system.multicall", [requests]);
    if (!Array.isArray(res) || res.length !== requests.length) {
      throw new Error(`malformed system.multicall response`);
    }

    const output: XmlRpcValueOrFault[] = [];

    const createFault = (fault: XmlRpcStruct = {}) => {
      const faultString = typeof fault.faultString === "string" ? fault.faultString : undefined;
      const faultCode = typeof fault.faultCode === "number" ? fault.faultCode : undefined;
      return new XmlRpcFault(faultString, faultCode);
    };

    for (const entry of res) {
      if (!Array.isArray(entry) || entry.length !== 1) {
        output.push(createFault(entry as XmlRpcStruct));
      } else {
        output.push(entry[0]);
      }
    }

    return output;
  }
}
