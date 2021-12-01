import {GenericService} from "@src/util/svc";
import {get, put} from "@src/util/db";
const bdb = require("bdb");
const DB = require("bdb/lib/DB");
const rules = require("hsd/lib/covenants/rules");

const NAME_CACHE: string[] = [];
const NAME_MAP: {[hash: string]: string} = {};

export default class NodeService extends GenericService {
  store: typeof DB;

  async getHeaders(): Promise<any> {
    const {apiHost, apiKey} = await this.exec("setting", "getAPI");

    return {
      "Content-Type": "application/json",
      Authorization: apiKey
        ? "Basic " + Buffer.from(`x:${apiKey}`).toString("base64")
        : "",
    };
  }

  async getTokenURL(): Promise<string> {
    const {apiHost, apiKey} = await this.exec("setting", "getAPI");
    const [protocol, url] = apiHost.split("//");

    return `${protocol}//x:${apiKey}@${url}`;
  }

  estimateSmartFee = async (opt: number) => {
    const headers = await this.getHeaders();
    return this.fetch(null, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        method: "estimatesmartfee",
        params: [opt],
      }),
    });
  };

  getLatestBlock = async () => {
    const blockchanInfo = await this.getBlockchainInfo();
    const block = await this.getBlockByHeight(blockchanInfo!.result!.blocks);

    const {hash, height, time} = block || {};

    return {
      hash,
      height,
      time,
    };
  };

  async getBlockchainInfo() {
    const headers = await this.getHeaders();

    return this.fetch(null, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        method: "getblockchaininfo",
        params: [],
      }),
    });
  }

  async sendRawTransaction(txJSON: any) {
    const headers = await this.getHeaders();

    return this.fetch(null, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        method: "sendrawtransaction",
        params: [txJSON],
      }),
    });
  }

  async getBlockByHeight(blockHeight: number) {
    const cachedEntry = await get(this.store, `blockdata-${blockHeight}`);
    if (cachedEntry) return cachedEntry;

    const headers = await this.getHeaders();
    const block = await this.fetch(`block/${blockHeight}`, {
      method: "GET",
      headers: headers,
    });
    await put(this.store, `blockdata-${blockHeight}`, block);
    return block;
  }

  async addNameHash(name: string, hash: string) {
    return put(this.store, `namehash-${hash}`, {result: name});
  }

  async hashName(name: string) {
    return rules.hashName(name).toString("hex");
  }

  async getNameByHash(hash: string) {
    if (NAME_MAP[hash]) return NAME_MAP[hash];

    const cachedEntry = await get(this.store, `namehash-${hash}`);
    if (cachedEntry) return cachedEntry;

    const headers = await this.getHeaders();
    const name = await this.fetch(null, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        method: "getnamebyhash",
        params: [hash],
      }),
    });

    await put(this.store, `namehash-${hash}`, name);
    NAME_CACHE.push(hash);
    NAME_MAP[hash] = name;
    if (NAME_CACHE.length > 50000) {
      const first = NAME_CACHE.shift();
      delete NAME_MAP[first as string];
    }
    return name;
  }

  async getNameInfo(tld: string) {
    const headers = await this.getHeaders();
    return this.fetch(null, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        method: "getnameinfo",
        params: [tld],
      }),
    });
    // await put(this.store, `nameinfo-${tld}`, json);
  }

  async getNameResource(tld: string) {
    const headers = await this.getHeaders();
    return this.fetch(null, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        method: "getnameresource",
        params: [tld],
      }),
    });
  }

  async getCoin(txHash: string, txIndex: number) {
    const headers = await this.getHeaders();
    return this.fetch(`coin/${txHash}/${txIndex}`, {
      method: "GET",
      headers: headers,
    });
  }

  async getTXByHash(txHash: string) {
    const headers = await this.getHeaders();
    return this.fetch(`tx/${txHash}`, {
      method: "GET",
      headers: headers,
    });
  }

  async getBlockEntry(height: number) {
    const cachedEntry = await get(this.store, `entry-${height}`);
    if (cachedEntry) return cachedEntry;

    const headers = await this.getHeaders();

    const blockEntry = await this.fetch(`header/${height}`, {
      method: "GET",
      headers: headers,
    });

    await put(this.store, `entry-${height}`, blockEntry);

    return blockEntry;
  }

  async getTXByAddresses(
    addresses: string[],
    startBlock: number,
    endBlock: number,
    transactions: any[] = []
  ): Promise<any[]> {
    const headers = await this.getHeaders();
    const {apiHost} = await this.exec("setting", "getAPI");

    const resp = await fetch(`${apiHost}/tx/address`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        addresses,
        startBlock,
        endBlock,
      }),
    });

    const json = await resp.json();

    if (apiHost.includes("api.handshakeapi.com")) {
      if (resp.status === 200 && endBlock === json.endBlock) {
        return transactions.concat(json.txs);
      }

      if (resp.status === 413) {
        return this.getTXByAddresses(
          addresses,
          json.endBlock,
          endBlock,
          transactions.concat(json.txs)
        );
      }

      throw new Error(`Unknown response status: ${resp.status}`);
    } else {
      return json;
    }
  }

  async start() {
    this.store = bdb.create("/node-store");
    await this.store.open();
  }

  async stop() {}

  async fetch(path: string | null, init: RequestInit): Promise<any> {
    const {apiHost} = await this.exec("setting", "getAPI");
    const resp = await fetch(path ? `${apiHost}/${path}` : apiHost, init);

    if (resp.status !== 200) {
      console.error(`Bad response code ${resp.status}.`);

      try {
        const json = resp.json();
        console.error("Body JSON:", json);
      } catch (e) {
        console.error("Error printing body JSON.");
      }

      throw new Error(
        `Non-200 status code: ${resp.status}. Check the logs for more details.`
      );
    }

    return resp.json();
  }
}
