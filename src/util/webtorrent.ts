import {consumeDMT} from "@src/background/resolve";

const mime = require("mime-types");
const magnet = require('magnet-uri');
import WebTorrent from 'webtorrent';
const client = new WebTorrent();

class TorrentSVC {
  torrents: { [hostname: string]: WebTorrent.Torrent };
  torrentURIs: { [hostname: string]: string };
  torrentDMTs: { [hostname: string]: string };
  torrentStatuses: { [hostname: string]: boolean };
  torrentErrors: { [hostname: string]: string };

  constructor() {
    // @ts-ignore
    this.torrents = {};
    this.torrentURIs = {};
    this.torrentDMTs = {};
    this.torrentStatuses = {};
    this.torrentErrors = {};
  }

  addTorrent(hostname: string, torrent: WebTorrent.Torrent) {
    this.torrents[hostname] = torrent;
  }

  addTorrentURI(hostname: string, uri: string) {
    this.torrentURIs[hostname] = uri;
  }

  addTorrentDMT(hostname: string, dmt: string) {
    this.torrentDMTs[hostname] = dmt;
  }

  addTorrentStatus(hostname: string, status: boolean) {
    this.torrentStatuses[hostname] = status;
  }

  addTorrentError(hostname: string, errorMessage: string) {
    this.torrentErrors[hostname] = errorMessage;
  }

  clearTorrent(hostname: string) {
    const torrent = this.torrents[hostname];
    if (this.torrents[hostname]) delete this.torrents[hostname];
    if (this.torrentURIs[hostname]) delete this.torrentURIs[hostname];
    if (this.torrentDMTs[hostname]) delete this.torrentDMTs[hostname];
    if (this.torrentStatuses[hostname]) delete this.torrentStatuses[hostname];
    if (this.torrentErrors[hostname]) delete this.torrentErrors[hostname];
    try {
      if (torrent?.destroy) torrent.destroy();
    } catch (e) {}
    try {
      if (torrent?.infoHash) client.remove(torrent.infoHash);
    } catch (e) {}

    const keys = Object.keys(localStorage);

    for (let key of keys) {
      const [savedHost, filename] = key.split('/');

      if (filename && savedHost === hostname) {
        localStorage.removeItem(key);
      }
    }
  }

  getTorrent(hostname: string) {
    return {
      torrent: this.torrents[hostname],
      uri: this.torrentURIs[hostname],
      dmt: this.torrentDMTs[hostname],
      status: this.torrentStatuses[hostname],
      error: this.torrentErrors[hostname],
    }
  }
}

export const torrentSVC = new TorrentSVC();

export function consume(uri: string, hostname: string) {
  if (torrentSVC.getTorrent(hostname).uri) {
    return;
  }

  if (torrentSVC.getTorrent(hostname).torrent) {
    return torrentSVC.getTorrent(hostname).torrent;
  }

  const parsed = magnet.decode(uri);

  let magnetURI = uri;

  if (parsed?.xs) {
    torrentSVC.clearTorrent(hostname);
    torrentSVC.addTorrentDMT(hostname, uri);
    magnetURI = consumeDMT(parsed?.publicKey);

    if (!magnetURI) {
      torrentSVC.addTorrentError(hostname, 'unable to resolve dht');
    }
  }

  if (!magnetURI) return;

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
    (torrent) => {
      torrentSVC.addTorrent(hostname, torrent);

      torrent.once('done', async function () {
        const files = torrent.files;
        for (let file of files) {
          await getTorrentDataURLAsync(file, `${hostname}/${file.name}`);
        }

        torrentSVC.addTorrentStatus(hostname, true);

        setTimeout(() => {
          torrentSVC.clearTorrent(hostname);
        }, 15 * 60 * 1000);
      });
    },
  );

  torrentSVC.addTorrentURI(hostname, magnetURI);
}

export function getTorrentDataURL(file: any, filepath: string) {
  const cached = localStorage.getItem(filepath);

  if (cached) return cached;

  file.getBuffer((err: any, buf: Buffer) => {
    const base64 = buf.toString('base64');
    const mimeType = mime.lookup(file.name);
    const dataUrl = `data:${mimeType};base64,${base64}`;
    localStorage.setItem(filepath, dataUrl.slice(0, 2000000));
  });
}

function getTorrentDataURLAsync(file: any, filepath: string) {
  const cached = localStorage.getItem(filepath);

  if (cached) return cached;

  return new Promise((resolve) => {
    file.getBuffer((err: any, buf: Buffer) => {
      const base64 = buf.toString('base64');
      const mimeType = mime.lookup(file.name);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const limitedUrl = dataUrl.slice(0, 2000000);
      localStorage.setItem(filepath, limitedUrl);
      resolve(limitedUrl);
    });
  })
}
