import {consumeDMT} from "@src/background/resolve";

const mime = require("mime-types");
const ed = require('supercop.js');
const WebTorrent = require('webtorrent');
const magnet = require('magnet-uri');

const client = new WebTorrent({
  dht: {verify: ed.verify },
});

export const torrentCache: any = {};
export const torrentURICache: any = {};
export const torrentFileStatus: any = {};

export function consume(uri: string, hostname: string) {
  if (torrentURICache[hostname]) {
    return;
  }

  if (torrentCache[hostname]) {
    return torrentCache[hostname];
  }

  const parsed = magnet.decode(uri);

  let magnetURI = uri;

  if (parsed?.xs) {
    magnetURI = consumeDMT(parsed?.publicKey);
  }

  client.on('error', (err: any) => {
    console.error('webtorrent error', err);
  });

  client.add(
    magnetURI,
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
      torrentCache[hostname] = torrent;

      torrent.on('done', async function () {
        const files = torrent.files;
        for (let file of files) {
          const [_, extension] = file.name.split('.');
          await getTorrentDataURLAsync(file, `${hostname}/${file.name}`, extension);
        }

        torrentFileStatus[hostname] = true;
      });
    },
  );

  torrentURICache[hostname] = magnetURI;
}

export const torrentFileCache: any = {};
export function getTorrentDataURL(file: any, filepath: string, extension: string) {
  if (torrentFileCache[filepath]) return torrentFileCache[filepath];

  file.getBuffer((err: any, buf: Buffer) => {
    const base64 = buf.toString('base64');
    const mimeType = mime.lookup(file.name);
    const dataUrl = `data:${mimeType};base64,${base64}`;
    torrentFileCache[filepath] = dataUrl.slice(0, 2000000);
  });
}

function getTorrentDataURLAsync(file: any, filepath: string, extension: string) {
  if (torrentFileCache[filepath]) return torrentFileCache[filepath];

  return new Promise((resolve) => {
    file.getBuffer((err: any, buf: Buffer) => {
      const base64 = buf.toString('base64');
      const mimeType = mime.lookup(file.name);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      torrentFileCache[filepath] = dataUrl.slice(0, 2000000);
      resolve(torrentFileCache[filepath]);
    });
  })
}
