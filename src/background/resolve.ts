const magnet = require('magnet-uri');

export async function consumeDMT(pubkey: string): Promise<string> {
  try {
    const url = "http://18.236.141.188:3000/dmt/" + pubkey;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    const infohash = await response.text();

    if (!infohash) {
      return '';
    }

    return 'magnet:?xt=urn:btih:' + infohash;
  } catch (error) {
    console.error('Failed to consume DMT for', pubkey, error);
    return '';
  }
}

export async function getMagnetRecord(hostname: string): Promise<string|null> {
  try {
    const url = "https://api.handshakeapi.com/hsd";
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        method: 'getnameresource',
        params: [hostname],
      })
    });

    const json = await response.json();

    if (!json?.error) {
      const records = json?.result?.records || [];
      for (let record of records) {
        if (record.type === 'TXT') {
          const text: string = record.txt[0];
          const parsed = magnet.decode(text);
          if (parsed?.xt || parsed?.xs) {
            return text;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get magnet record for', hostname, error);
    return null;
  }
}
