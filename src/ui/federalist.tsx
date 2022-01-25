import {browser} from "webextension-polyfill-ts";
import ReactDOM from "react-dom";
import React, {ReactElement, useCallback, useEffect, useRef, useState} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Select from "@src/ui/components/Select";
const ed = require('supercop.js');
const WebTorrent = require('webtorrent');
const magnet = require('magnet-uri');

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  browser.runtime.connect();
  ReactDOM.render(
    <Federalist />,
    document.getElementById("federalist"),
  );
});

function Federalist(): ReactElement {
  const [hostname, setHostname] = useState<string|null>('');
  const [files, setFiles] = useState([]);
  const wrapperEl = useRef<HTMLDivElement>(null);
  const [selectedIndex, selectIndex] = useState<number>(-1);

  useEffect(() => {
    const url = new URL(window.location.href);
    setHostname(url.searchParams.get('h'));
  }, [window.location.href]);

  useEffect(() => {
    if (!hostname) return;

    (async () => {
      const torrent: any = await consume('magnet:?xt=urn:btih:278d9ed2307560be3dae6e3a593e94f82ca8deb2&dn=dist&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com');
      setFiles(torrent.files);
      selectIndex(getHTMLFromFiles(torrent));
    })()
  }, [hostname]);

  useEffect(() => {
    if (wrapperEl?.current) {
      const el = wrapperEl?.current;
      const file: any = files[selectedIndex];

      if (file) {
        file.getBuffer((err: any, buf: Buffer) => {
          const base64 = buf.toString('base64');
          console.log(`data:text/html;base64,${base64}`);
        });
        file.appendTo(el);
      }
    }
  }, [wrapperEl, files, selectedIndex]);

  const onSelectFile = useCallback((e) => {
    selectIndex(e.target.value);
  },[files]);

  return (
    <div className="federalist">
      <Select
        className="federalist__select"
        options={files.map((file: any, i) => ({
          value: i,
          children: file.name,
        }))}
        onChange={onSelectFile}
        value={selectedIndex}
      />
      <div
        className="federalist__renderer"
        ref={wrapperEl}
      />
    </div>
  )
}

function getHTMLFromFiles(torrent: any): number {
  const files = torrent.files || [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name.slice(-4).toLowerCase() === 'html') {
      return i;
    }
  }

  return 0;
}

async function consume(uri: string) {
  const client = new WebTorrent({
    dht: {verify: ed.verify },
  });

  // const parsed = magnet.decode(uri);

  client.on('error', () => {
    return "error";
  });

  return new Promise((resolve,reject) => {
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
        console.log(torrent);
        resolve(torrent);
      },
    );
  });
}
