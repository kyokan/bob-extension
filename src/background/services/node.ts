import {GenericService} from "@src/util/svc";
const bdb = require('bdb');
const DB = require('bdb/lib/DB');
import {get, put} from '@src/util/db';

export default class NodeService extends GenericService {
  store: typeof DB;

  async getHeaders(): Promise<any> {
    const { apiHost, apiKey } = await this.exec('setting', 'getAPI');
    const {hostname} = new URL(apiHost);
    const isLocalhost = ['127.0.0.1', 'localhost'].includes(hostname);
    const headers: any = {
      'Authorization': apiKey && 'Basic ' + Buffer.from(`x:${apiKey}`).toString('base64'),
    };

    if (true || !isLocalhost) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async getTokenURL(): Promise<string> {
    const { apiHost, apiKey } = await this.exec('setting', 'getAPI');
    const [protocol, url] = apiHost.split('//');

    return `${protocol}//x:${apiKey}@${url}`;
  }

  getLatestBlock = async () => {
    const blockchanInfo = await this.getBlockchainInfo();
    const block = await this.getBlock(blockchanInfo!.result!.bestblockhash);

    const {
      hash,
      height,
      time,
    } = block.result || {};

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

  async getBlock(blockHash: string) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getblock',
        params: [blockHash],
      }),
    });

    return await resp.json();
  }

  async getBlockByHeight(blockHeight: number) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const resp = await fetch(`${apiHost}/block/${blockHeight}`, {
      method: 'GET',
      headers: headers,
    });

    return await resp.json();
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
    return await resp.json();
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
