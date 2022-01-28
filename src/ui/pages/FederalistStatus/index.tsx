import React, {ReactElement, useCallback, useEffect, useState} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import "./federalist.scss";
import hero from "@src/ui/pages/FederalistStatus/hero";

export default function FederalistStatus(): ReactElement {
  const [hostname, setHostname] = useState<string|null>('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(false);
  const [ready, setReady] = useState(false);
  const [uri, setURI] = useState('');
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

        console.log(resp);

        setProgress(downloaded/length);
        setStatus(status);
        setReady(ready);
        setURI(uri);

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
            {statusText}
          </div>
          <div className="federalist__progress__title__uri">
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
          </div>
        </div>
        <div className="federalist__progress__bar">
          <div
            className="federalist__progress__bar__content"
            style={{ width: `${Math.floor(progress * 100)}%` }}
          />
        </div>
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
