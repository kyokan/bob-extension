import React, {ReactElement, useCallback, useEffect, useState} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import "./federalist.scss";
import hero from "@src/ui/pages/FederalistStatus/hero";

export default function FederalistStatus(): ReactElement {
  const [hostname, setHostname] = useState<string|null>('');
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [status, setStatus] = useState(false);
  const [ready, setReady] = useState(false);
  const [uri, setURI] = useState('');
  const [numPeers, setNumPeers] = useState(0);
  const [error, setError] = useState('');
  const [dht, setDHT] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const url = new URL(window.location.href);
    setHostname(url.searchParams.get('h'));
  }, [window.location.href]);

  useEffect(() => {
    (async () => {
      if (!hostname) return;

      let downloadSpeed = 0;
      let downloaded = 0;
      let length = 0;
      let status = false;
      let ready = false;
      let uri = '';
      let numPeers = 0;
      let error = '';
      let dht = '';

      while (!status && hostname) {
        const resp = await postMessage({
          type: MessageTypes.CHECK_TORRENT,
          payload: hostname,
        });

        downloaded = resp.downloaded;
        downloadSpeed = resp.downloadSpeed;
        length = resp.length;
        status = resp.status;
        ready = resp.ready;
        uri = resp.uri;
        numPeers = resp.numPeers;
        error = resp.error;
        dht = resp.dht;

        console.log(resp);

        setProgress(downloaded/length);
        setStatus(status);
        setReady(ready);
        setURI(uri);
        setNumPeers(numPeers || 0);
        setError(error);
        setDHT(dht);
        setDownloaded(downloaded || 0);
        setDownloadSpeed(downloadSpeed || 0);

        if (status) {
          for (let i = 0; i < 5; i++) {
            setSecondsLeft(5 - i);
            await new Promise(resolve => {
              setTimeout(resolve, 1000);
            });
          }

          await postMessage({
            type: MessageTypes.OPEN_FEDERALIST,
            payload: hostname,
          });
        }

        await new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
      }

    })();
  }, [hostname]);

  const redirect = useCallback(() => {
      postMessage({
        type: MessageTypes.OPEN_FEDERALIST,
        payload: hostname,
      });
  }, [hostname]);

  const reset = useCallback(async () => {
    setProgress(0);
    setStatus(false);
    setReady(false);
    setURI('');
    setNumPeers(0);
    setError('');
    setDHT('');
    setDownloaded(0);
    setDownloadSpeed(0);

    await postMessage({
      type: MessageTypes.CLEAR_TORRENT,
      payload: hostname,
    });

    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });

    await postMessage({
      type: MessageTypes.CONSUME_TORRENT,
      payload: hostname,
    });

    window.location.reload();
  }, [hostname]);

  let statusText = '';

  if (status) {
    statusText = `${hostname} is ready!`;
  } else if (!ready) {
    statusText = 'readying torrent...';
  } else if (!status) {
    statusText = 'downloading...';
  }

  return (
    <div className="federalist">
      <img
        className="federalist__hero"
        src={hero}
      />
      <div className="federalist__progress">
        <div className="federalist__progress__title">
          <div className="federalist__progress__title__text">
            { error ? 'something went wrong :(' : statusText}
          </div>
          <div className="federalist__progress__title__uri">
            {
              (dht && !uri) && (
                <a
                  className="federalist__progress__title__uri-button"
                  href={dht}
                >
                  DHT Link
                </a>
              )
            }
            {
              uri && (
                <a
                  className="federalist__progress__title__uri-button"
                  href={uri}
                >
                  Magnet Link
                </a>
              )
            }
            {
              (uri || dht) && (
                <div
                  className="federalist__progress__title__reset-button"
                  onClick={reset}
                >
                  Reset
                </div>
              )
            }

          </div>
        </div>
        <div className="federalist__progress__bar">
          <div
            className="federalist__progress__bar__content"
            style={{ width: `${Math.floor(progress * 100)}%` }}
          />
        </div>
        {
          error && (
            <div className="federalist__progress__error">
              <span>{`${error} - please contact site administrator`}</span>
            </div>
          )
        }
        {
          uri && (
            <div className="federalist__progress__desc">
              <span>{`Peers: ${numPeers} - Downloaded: ${prettyBytes(downloaded)} - Download Speed: ${prettyBytes(downloadSpeed)}`}</span>
            </div>
          )
        }
        {
          status && (
            <div className="federalist__progress__desc">
              <span>Redirecting you in {secondsLeft} seconds... </span>
              <span>or <span className="federalist__redirect" onClick={redirect}>click here</span> to redirect now</span>
            </div>
          )
        }
      </div>
    </div>
  )
}

function prettyBytes(bytes: number): string {
  if (bytes < 999999) return (bytes / 1000).toFixed(2) + ' KB';
  return (bytes / 1000000).toFixed(2) + ' MB';
}
