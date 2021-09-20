import {WebRequest} from "webextension-polyfill-ts";
import normalTLDs from "../static/normal-tld.json";
import OnBeforeRequestDetailsType = WebRequest.OnBeforeRequestDetailsType;

function sleep(milliseconds: number, resolved: string) {
  // synchronous XMLHttpRequests from Chrome extensions are not blocking event handlers. That's why we use this
  // pretty little sleep function to try to get the IP of a .bit domain before the request times out.
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (((new Date().getTime() - start) > milliseconds) || (sessionStorage.getItem(resolved) != null)){
      break;
    }
  }
}

// run script when a request is about to occur
export default function resolve(details: OnBeforeRequestDetailsType) {
  const originalUrl = new URL(details.url);
  const hostname = originalUrl.hostname;
  const protocol = originalUrl.protocol;

  if (!['http:', 'https:'].includes(protocol)){
    return;
  }

  const tld = hostname.includes('.')
    ? hostname.split('.')[hostname.split('.').length - 1]
    : hostname;

  // @ts-ignore
  if (normalTLDs[tld]) {
    return;
  }

  const port = (originalUrl.protocol == "https:" ? "443" : "80");
  const access = (originalUrl.protocol == "https:" ? "HTTPS" : "PROXY");

  // Check the local cache to save having to fetch the value from the server again.
  if (sessionStorage.getItem(hostname) == undefined) {
    const xhr = new XMLHttpRequest();
    const url = "https://api.handshakeapi.com/hsd/hsd/lookup/"+hostname;
    // synchronous XMLHttpRequest is actually asynchronous
    // check out https://developer.chrome.com/extensions/webRequest
    xhr.open("GET", url, false);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        // Get the ip address returned from the DNS proxy server.
        const ipAddresses = JSON.parse(xhr.responseText);
        // store the IP for handshake hostname in the local cache which is reset on each browser restart
        sessionStorage.setItem(hostname, ipAddresses[0]);
      }
    };
    xhr.send();
    // block the request until the new proxy settings are set. Block for up to two seconds.
    sleep(10000, hostname);
  }

  // Get the IP from the session storage.
  const ip = sessionStorage.getItem(hostname);
  console.log(ip, typeof ip);
  const config = {
    mode: "pac_script",
    pacScript: {
      data: "function FindProxyForURL(url, host) {\n" +
        "  if ('"+ip+"' === 'undefined') return 'DIRECT';\n" +
        "  if (dnsDomainIs(host, '"+hostname+"'))\n" +
        "    return '"+access+" "+ip+":"+port+"';\n" +
        "  return 'DIRECT';\n" +
        "}"
    }
  };

  chrome.proxy.settings.set({value: config, scope: 'regular'},function() {});
  console.log('IP '+ip+' for '+hostname+' found, config is changed: '+JSON.stringify(config));
};

