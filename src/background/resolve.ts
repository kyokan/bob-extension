import {browser, WebRequest} from "webextension-polyfill-ts";
import normalTLDs from "../static/normal-tld.json";
import OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;
import {consume, getTorrentDataURL, torrentSVC} from "@src/util/webtorrent";
const magnet = require('magnet-uri');

// run script when a request is about to occur
export default function resolve(
  details: OnBeforeRequestDetailsType
) {
  // const isResolverActive = await app.exec("setting", "getResolver");
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


  // Check the local cache to save having to fetch the value from the server again.
  if (sessionStorage.getItem(hostname) == undefined) {
    const ipAddresses = getIPAddresses(hostname);

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

  // Resolve Federalist
  const magnetURI = getMagnetRecord(hostname);
  const pathname = originalUrl.pathname.slice(1) || 'index.html';

  if (magnetURI) {
    let torrent = torrentSVC.getTorrent(hostname).torrent;

    if (!torrent) {
      torrentSVC.addTorrentError(hostname, '');
      browser.tabs.update(details.tabId, {
        url: browser.extension.getURL('federalist.html') + '?h=' + hostname,
      });
      setTimeout(() => {
        consume(magnetURI, hostname);
      }, 1000);
      return;
    }

    const files = torrent.files;

    for (let file of files) {
      if (file.name === pathname) {
        const dataURL = getTorrentDataURL(file, `${hostname}/${pathname}`);

        if (dataURL) {
          return {
            redirectUrl: dataURL,
          };
        } else {
          browser.tabs.update(details.tabId, {
            url: browser.extension.getURL('federalist.html') + '?h=' + hostname,
          });
          return;
        }
      }
    }
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

function getIPAddresses(hostname: string): string[] {
  const start = Date.now();
  let done = false;
  let ipAddresses: any = [];
  const xhr = new XMLHttpRequest();
  const url = "https://api.handshakeapi.com/hsd/lookup/"+hostname;
  xhr.open("GET", url, false);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      ipAddresses = JSON.parse(xhr.responseText);
      sessionStorage.setItem(hostname, ipAddresses[0]);
      done = true;
    }
  };
  xhr.send();

  for (let i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > 10000 || done) {
      break;
    }
  }

  return ipAddresses;
}

export function consumeDMT(pubkey: string): string {
  const start = Date.now();
  let infohash: string = '';
  let done = false;
  const xhr = new XMLHttpRequest();
  const url = "http://18.236.141.188:3000/dmt/" + pubkey;
  xhr.open("GET", url, false);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      const json = xhr.responseText;
      infohash = json;
      done = true;
    }
  };

  xhr.send();

  for (let i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > 10000 || done) {
      break;
    }
  }

  if (!infohash) {
    return '';
  }

  return 'magnet:?xt=urn:btih:' + infohash;
}

export function getMagnetRecord(hostname: string): string|null {
  const start = Date.now();
  let done = false;
  let magnetURI: string|null = null;

  const xhr = new XMLHttpRequest();
  const url = "https://api.handshakeapi.com/hsd";
  xhr.open("POST", url, false);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      const json = JSON.parse(xhr.responseText);
      if (!json?.error) {
        const records = json?.result?.records || [];
        for (let record of records) {
          if (record.type === 'TXT') {
            const text: string = record.txt[0];
            const parsed = magnet.decode(text);
            if (parsed?.xt || parsed?.xs) {
              magnetURI = text;
            }
          }
        }
      }

      done = true;
    }
  };

  xhr.send(JSON.stringify({
    method: 'getnameresource',
    params: [hostname],
  }));

  for (let i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > 10000 || done) {
      break;
    }
  }

  return magnetURI;
}
