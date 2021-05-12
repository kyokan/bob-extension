import {GenericService} from "@src/util/svc";
const bdb = require('bdb');
const DB = require('bdb/lib/DB');
import {get, put} from '@src/util/db';

export default class NodeService extends GenericService {
  store: typeof DB;

  async getHeaders(): Promise<any> {
    const { apiHost, apiKey } = await this.exec('setting', 'getAPI');
    const {hostname} = new URL(apiHost);
    const is5pi = ['5pi.io', 'www.5pi.io'].includes(hostname);

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': apiKey
        ? 'Basic ' + Buffer.from(`x:${apiKey}`).toString('base64')
        : is5pi
          ? 'Basic ' + Buffer.from(`x:775f8ca39e1748a7b47ff16ad4b1b9ad`).toString('base64')
          : '',
    };

    return headers;
  }

  async getTokenURL(): Promise<string> {
    const { apiHost, apiKey } = await this.exec('setting', 'getAPI');
    const [protocol, url] = apiHost.split('//');

    return `${protocol}//x:${apiKey}@${url}`;
  }

  estimateSmartFee = async (opt: number) => {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'estimatesmartfee',
        params: [opt],
      }),
    });

    return await resp.json();
  };

  getLatestBlock = async () => {
    const blockchanInfo = await this.getBlockchainInfo();
    const block = await this.getBlockByHeight(blockchanInfo!.result!.blocks);

    const {
      hash,
      height,
      time,
    } = block || {};

    return {
      hash,
      height,
      time,
    };
  };

  async getBlockchainInfo () {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();

    const resp = await fetch(apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getblockchaininfo',
        params: [],
      }),
    });

    return await resp.json();
  }

  async sendRawTransaction (txJSON: any) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();

    const resp = await fetch(apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'sendrawtransaction',
        params: [txJSON],
      }),
    });

    return await resp.json();
  }

  async getBlockByHeight(blockHeight: number) {
    const cachedEntry = await get(this.store, `blockdata-${blockHeight}`);
    if (cachedEntry) return cachedEntry;

    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(`${apiHost}/block/${blockHeight}`, {
      method: 'GET',
      headers: headers,
    });

    const block = await resp.json();
    await put(this.store, `blockdata-${blockHeight}`, block);
    return block;
  }

  async addNameHash(name: string, hash: string) {
    return put(this.store, `namehash-${hash}`, {result: name});
  }

  async getNameByHash(hash: string) {
    const cachedEntry = await get(this.store, `namehash-${hash}`);
    if (cachedEntry) return cachedEntry;

    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getnamebyhash',
        params: [hash],
      }),
    });

    const name = await resp.json();
    await put(this.store, `namehash-${hash}`, name);
    return name;
  }

  async getNameInfo(tld: string) {
    // const cachedEntry = await get(this.store, `nameinfo-${tld}`);
    // if (cachedEntry) return cachedEntry;

    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getnameinfo',
        params: [tld],
      }),
    });
    const json = await resp.json();
    // await put(this.store, `nameinfo-${tld}`, json);
    return json;
  }

  async getCoin(txHash: string, txIndex: number) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(`${apiHost}/coin/${txHash}/${txIndex}`, {
      method: 'GET',
      headers: headers,
    });

    return await resp.json();
  }

  async getTXByHash(txHash: string) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(`${apiHost}/tx/${txHash}`, {
      method: 'GET',
      headers: headers,
    });

    return await resp.json();
  }

  async getBlockEntry(height: number) {
    const cachedEntry = await get(this.store, `entry-${height}`);
    if (cachedEntry) return cachedEntry;

    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();

    const resp = await fetch(`${apiHost}/header/${height}`, {
      method: 'GET',
      headers: headers,
    });

    const blockEntry = await resp.json();

    await put(this.store, `entry-${height}`, blockEntry);

    return blockEntry;
  }

  async getTXByAddresses(addresses: string[]) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(`${apiHost}/tx/address`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        addresses,
      }),
    });

    return await resp.json();
  }

  async start() {
    this.store = bdb.create('/node-store');
    await this.store.open();
  }

  async stop() {

  }
}
