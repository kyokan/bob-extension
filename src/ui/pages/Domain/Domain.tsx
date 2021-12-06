import React, {ReactElement, useEffect, useState} from "react";
import Icon from "@src/ui/components/Icon";
import {useHistory, useParams} from "react-router";
import "./domain-page.scss";
import {fetchDomainName, useDomainByName} from "@src/ui/ducks/domains";
import Name from "@src/ui/components/Name";
import {heightToMoment} from "@src/util/number";
import {useDispatch} from "react-redux";
import {
  RedeemButton,
  RegisterButton,
} from "@src/ui/components/HomeActionButton";
import MessageTypes from "@src/util/messageTypes";
import postMessage from "@src/util/postMessage";
const Network = require("hsd/lib/protocol/network");
const networkType = process.env.NETWORK_TYPE || "main";

export default function DomainPage(): ReactElement {
  const {name} = useParams<{name: string}>();
  const history = useHistory();
  const domain = useDomainByName(name);
  const dispatch = useDispatch();
  const network = Network.get(networkType);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    dispatch(fetchDomainName(name));
    (async function onDomainPageMount() {
      const payload = await postMessage({
        type: MessageTypes.GET_NAME_RESOURCE,
        payload: name,
      });
      const {result} = payload || {};
      const {records} = result || {};
      setRecords(records || []);
    })();
  }, [name]);

  useEffect(() => {
    if (!domain) return;
    const {ownerCovenantType} = domain;

    console.log({ownerCovenantType});
  }, [domain]);

  if (!domain) {
    return <></>;
  }

  const expiry = heightToMoment(
    domain.renewal + network.names.renewalWindow
  ).format("YYYY-MM-DD");

  return (
    <div className="domain-page">
      <div className="domain-page__header">
        <div className="domain-page__header__action">
          <Icon
            fontAwesome="fa-arrow-left"
            size={1.25}
            onClick={() => history.push(`/?defaultTab=domains`)}
          />
          <span onClick={() => () => history.push(`/?defaultTab=domains`)}>
            Back
          </span>
        </div>
        <div className="domain-page__header__content">
          <div className="domain-page__header__content__name">
            <Name name={name} slash />
          </div>
          <div className="domain-page__header__content__expiry">
            {`Expired on ${expiry}`}
          </div>
          <div className="domain-page__header__content__buttons">
            {!domain?.ownerCovenantType && <RedeemButton name={name} />}
            {domain?.ownerCovenantType === "REVEAL" && (
              <RegisterButton name={name} />
            )}
          </div>
        </div>
      </div>
      <div className="domain-page__content">
        <div className="domain-page__records-group">
          <div className="domain-page__records-group__header">
            <div className="domain-page__records-group__header__label">
              Root Zone DNS
            </div>
          </div>
          {!records.length && (
            <div className="domain-page__record">
              <div className="domain-page__record__empty">No Records Found</div>
            </div>
          )}
          {records.map((record: any) => {
            const {type} = record;
            return (
              <div className="domain-page__record">
                <div className="domain-page__record__type">{type} Record</div>
                <div className="domain-page__record__kvs">
                  {Object.keys(record).map(
                    (key) =>
                      key !== "type" && (
                        <div className="domain-page__record__kv">
                          <div className="domain-page__record__key">{key}</div>
                          <div className="domain-page__record__value">
                            {record[key]}
                          </div>
                        </div>
                      )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
