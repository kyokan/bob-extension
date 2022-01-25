import {WebRequest} from "webextension-polyfill-ts";
import normalTLDs from "../static/normal-tld.json";
import OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;
import {AppService} from "@src/util/svc";
const magnet = require('magnet-uri');
const ed = require('supercop.js');
const WebTorrent = require('webtorrent');

const torrentCache: any = {};
// run script when a request is about to occur
export default async function resolve(
  app: AppService,
  details: OnBeforeRequestDetailsType
) {
  const isResolverActive = await app.exec("setting", "getResolver");
  const originalUrl = new URL(details.url);
  const hostname = originalUrl.hostname;
  const protocol = originalUrl.protocol;

  // if (!isResolverActive) {
  //   return;
  // }

  if (!["http:", "https:"].includes(protocol)) {
    return;
  }

  const tld = hostname.includes(".")
    ? hostname.split(".")[hostname.split(".").length - 1]
    : hostname;

  const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // @ts-ignore
  if (normalTLDs[tld] || IP_REGEX.test(hostname)) {
    return;
  }

  const port = originalUrl.protocol == "https:" ? "443" : "80";
  const access = originalUrl.protocol == "https:" ? "HTTPS" : "PROXY";

  const [magnetURI, dmtURI] = await getMagnetRecord(hostname, app);
  const pathname = originalUrl.pathname.slice(1) || 'index.html';

  if (magnetURI) {
    let torrent = torrentCache[hostname];
    if (!torrent) {
      torrent = await consume(magnetURI);
      torrentCache[hostname] = torrent;
    }

    const files = torrent.files;

    for (let file of files) {
      if (file.name === pathname) {
        const blobURL = await getTorrentBlobURL(file);
        console.log(blobURL)
        return Promise.resolve({redirectUrl : blobURL});
      }
    }
  }

  // Check the local cache to save having to fetch the value from the server again.
  if (sessionStorage.getItem(hostname) == undefined) {
    const ipAddresses = await getIPAddresses(hostname);

    if (ipAddresses[0]) {
      sessionStorage.setItem(hostname, ipAddresses[0]);
      sleep(10000, hostname);
    }
  }

  // Get the IP from the session storage.
  const ip = sessionStorage.getItem(hostname);

  if (ip) {
    const config = {
      mode: "pac_script",
      pacScript: {
        data:
          "function FindProxyForURL(url, host) {\n" +
          "  if ('" + ip + "' === 'undefined') return 'DIRECT';\n" +
          "  if (dnsDomainIs(host, '" + hostname + "'))\n" +
          "    return '" + access + " " + ip + ":" + port + "';\n" +
          "  return 'DIRECT';\n" +
          "}",
      },
    };

    chrome.proxy.settings.set({value: config, scope: "regular"}, function () {});
  }
}

function sleep(milliseconds: number, resolved: string) {
  // synchronous XMLHttpRequests from Chrome extensions are not blocking event handlers. That's why we use this
  // pretty little sleep function to try to get the IP of a .bit domain before the request times out.
  const start = new Date().getTime();
  for (let i = 0; i < 1e7; i++) {
    if (
      new Date().getTime() - start > milliseconds ||
      sessionStorage.getItem(resolved) != null
    ) {
      break;
    }
  }
}

async function getTorrentBlobURL(file: any): Promise<string> {
  return new Promise((resolve, reject) => {
    file.getBlobURL((err: any, url: string) => {
      if (err) return reject(err);
      resolve(url);
    });
  })

}

async function getIPAddresses(hostname: string): Promise<string[]> {
  const url = "https://api.handshakeapi.com/hsd/lookup/"+hostname;
  const resp = await fetch(url);
  const ipAddresses = await resp.json();
  return ipAddresses;
}

async function getMagnetRecord(hostname: string, app: AppService): Promise<(string|null)[]> {
  if (hostname === 'dklm') return ['magnet:?xt=urn:btih:278d9ed2307560be3dae6e3a593e94f82ca8deb2&dn=dist', null];

  const resp = await fetch('https://api.handshakeapi.com/hsd', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'getnameresource',
      params: [hostname],
    }),
  });
  const json = await resp.json();

  if (!json?.error) {
    const records = json?.result?.records || [];
    for (let record of records) {
      if (record.type === 'TXT') {
        const text: string = record.txt[0];
        const parsed = magnet.decode(text);
        if (parsed?.xt) {
          return [text, null];
        } else if (parsed?.xs) {
          return [null, text];
        }
      }
    }
    return [null, null];
  }

  return [null, null];
}

async function consume(uri: string) {
  const client = new WebTorrent({
    dht: {verify: ed.verify },
  });

  // const parsed = magnet.decode(uri);



  return new Promise((resolve, reject) => {
    client.on('error', () => {
      reject();
    });

    client.add(
      uri,
      {
        announce: [
          'udp://tracker.leechers-paradise.org:6969',
          'udp://tracker.coppersurfer.tk:6969',
          'udp://tracker.opentrackr.org:1337',
          'udp://explodie.org:6969',
          'udp://tracker.empire-js.us:1337',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.openwebtorrent.com',
        ],
      },
      (torrent: any) => {
        resolve(torrent);
      },
    );
  })
}
