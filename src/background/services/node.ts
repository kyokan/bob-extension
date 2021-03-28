import {GenericService} from "@src/util/svc";

const entryCache: {[key: string]: any} = {};

export default class NodeService extends GenericService {

  async getHeaders(): Promise<any> {
    const { apiHost, apiKey } = await this.exec('setting', 'getAPI');
    const {hostname} = new URL(apiHost);
    const isLocalhost = ['127.0.0.1', 'localhost'].includes(hostname);
    const headers: any = {
      'Authorization': apiKey && 'Basic ' + Buffer.from(`x:${apiKey}`).toString('base64'),
    };

    if (!isLocalhost) {
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

  async getBlockEntries(startHeight: number, endHeight: number) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();
    const blocks = [];

    for (let i = startHeight; i < endHeight; i++) {
      blocks.push(i);
    }
    const resp = await fetch(`${apiHost}/entry`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        blocks,
      }),
    });

    return await resp.json();
  }

  async getBlockEntry(height: number) {
    const { apiHost } = await this.exec('setting', 'getAPI');
    const headers = await this.getHeaders();

    const resp = await fetch(`${apiHost}/header/${height}`, {
      method: 'GET',
      headers: headers,
    });

    return await resp.json();
  }

  async getAllBlockEntries(startHeight = 0, endHeight = 10000, entries: any[] = []): Promise<any[]> {
    const response = entryCache[endHeight] || await this.getBlockEntries(startHeight, endHeight);
    entries = entries.concat(response);
    if (response.length === 10000) {
      entryCache[endHeight] = response;
      return await this.getAllBlockEntries(startHeight + 10000, endHeight + 10000, entries);
    }
    return entries;
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

  }

  async stop() {

  }
}
