import React, {ReactElement, ReactNode, useCallback, useEffect, useState} from "react";
import {RegularView, RegularViewContent, RegularViewHeader} from "@src/ui/components/RegularView";
import {Route, Switch, useHistory} from "react-router";
import Icon from "@src/ui/components/Icon";
import "./settings.scss";
import Input from "@src/ui/components/Input";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Button, {ButtonProps, ButtonType} from "@src/ui/components/Button";
import {useWalletState} from "@src/ui/ducks/wallet";

export default function Settings(): ReactElement {
  const history = useHistory();

  return (
    <RegularView className="settings">
      <Switch>
        <Route path="/settings/network">
          <RegularViewHeader
            onClose={() => history.push('/')}
          >
            <Icon size={1.25} fontAwesome="fa-arrow-left" onClick={() => history.goBack()}/>
            <div className="settings__title">Network</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/wallet">
          <RegularViewHeader
            onClose={() => history.push('/')}
          >
            <Icon size={1.25} fontAwesome="fa-arrow-left" onClick={() => history.goBack()}/>
            <div className="settings__title">Wallet</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/about">
          <RegularViewHeader
            onClose={() => history.push('/')}
          >
            <Icon size={1.25} fontAwesome="fa-arrow-left" onClick={() => history.goBack()}/>
            <div className="settings__title">About</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings">
          <RegularViewHeader
            onClose={() => history.push('/')}
          >
            Settings
          </RegularViewHeader>
        </Route>
      </Switch>
      <RegularViewContent>
        <Switch>
          <Route path="/settings/network">
            <NetworkContent />
          </Route>
          <Route path="/settings/wallet">
            <WalletContent />
          </Route>
          <Route path="/settings/about">

          </Route>
          <Route path="/settings">
            <SettingsSelectContent />
          </Route>
        </Switch>
      </RegularViewContent>
    </RegularView>
  )
}

function NetworkContent(): ReactElement {
  const [rpcUrl, setRPCUrl] = useState('');
  const [defaultRpcUrl, setDefaultRPCUrl] = useState('');
  const [rpcAPIKey, setAPIKey] = useState('');
  const [defaultRpcAPIKey, setDefaultAPIKey] = useState('');
  const [rpcURLError, setRPCUrlError] = useState('');
  const [rpcAPIKeyError, setRPCApiKeyError] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [savingAPIKey, setSavingApiKey] = useState(false);

  useEffect(() => {
    (async function onNetworkContentMount() {
      const { apiHost, apiKey } = await postMessage({ type: MessageTypes.GET_API });
      setDefaultRPCUrl(apiHost);
      setRPCUrl(apiHost);
      setAPIKey(apiKey);
      setDefaultAPIKey(apiKey);
    })();
  }, []);

  const onSaveURL = useCallback(async () => {
    setSavingUrl(true);
    try {
      await postMessage({
        type: MessageTypes.SET_RPC_HOST,
        payload: rpcUrl,
      });
      setDefaultRPCUrl(rpcUrl);
    } catch (e) {
      setRPCUrlError(e.message);
    }
    setSavingUrl(false);
  }, [rpcUrl]);

  const onSaveAPIKey = useCallback(async () => {
    setSavingApiKey(true);
    try {
      await postMessage({
        type: MessageTypes.SET_RPC_KEY,
        payload: rpcAPIKey,
      });
      setDefaultAPIKey(rpcAPIKey);
    } catch (e) {
      setRPCApiKeyError(e.message);
    }
    setSavingApiKey(false);
  }, [rpcAPIKey]);

  return (
    <>
      <SettingGroup
        name="RPC URL"
        primaryBtnProps={{
          children: 'Save',
          onClick: onSaveURL,
          disabled: defaultRpcUrl === rpcUrl || savingUrl,
          loading: savingUrl,
        }}
      >
        <Input
          value={rpcUrl}
          errorMessage={rpcURLError}
          onChange={e => setRPCUrl(e.target.value)}
        />
      </SettingGroup>
      <SettingGroup
        name="RPC API Key"
        primaryBtnProps={{
          children: 'Save',
          onClick: onSaveAPIKey,
          disabled: defaultRpcAPIKey === rpcAPIKey || savingAPIKey,
          loading: savingAPIKey,
        }}
      >
        <Input
          value={rpcAPIKey}
          errorMessage={rpcAPIKeyError}
          onChange={e => setAPIKey(e.target.value)}
        />
      </SettingGroup>
    </>
  );
}

function WalletContent(): ReactElement {
  const {rescanning} = useWalletState();

  const rescan = useCallback(() => {
    if (rescanning) return;

    postMessage({
      type: MessageTypes.CHECK_FOR_RESCAN,
    });
  }, [rescanning]);

  return (
    <>
      <SettingGroup
        name="Rescan"
        primaryBtnProps={{
          children: 'Rescan',
          onClick: rescan,
          disabled: rescanning,
          loading: rescanning,
        }}
      >
        <small>Perform a full rescan.</small>
      </SettingGroup>
    </>
  )
}

function SettingsSelectContent(): ReactElement {
  const history = useHistory();

  return (
    <>
      <SettingSelectGroup
        name="Network"
        description="Edit RPC network"
        onClick={() => history.push('/settings/network')}
      />
      <SettingSelectGroup
        name="Wallet"
        description="Rescan, backup, seed phrase"
        onClick={() => history.push('/settings/wallet')}
      />
      <SettingSelectGroup
        name="About"
        description="Version and general info"
        onClick={() => history.push('/settings/about')}
      />
    </>
  )
}

type SelectGroupProps = {
  name: string;
  description: string;
  onClick: () => void;
}

function SettingSelectGroup(props: SelectGroupProps) {
  return (
    <div className="setting-group" onClick={props.onClick}>
      <div className="setting-group__l">
        <div className="setting-group__title">
          { props.name }
        </div>
        <div className="setting-group__description">
          {props.description}
        </div>
      </div>
      <Icon fontAwesome="fa-angle-right" size={1.25} />
    </div>
  );
}

type GroupProps = {
  name: string;
  children: ReactNode;
  primaryBtnProps?: ButtonProps;
  secondaryBtnProps?: ButtonProps;
}

function SettingGroup(props: GroupProps) {
  return (
    <div className="setting-group">
      <div className="setting-group__l">
        <div className="setting-group__title">
          { props.name }
        </div>
        <div className="setting-group__children">
          {props.children}
        </div>
        <div className="setting-group__actions">
          {props.secondaryBtnProps && (
            <Button
              btnType={ButtonType.secondary}
              {...props.secondaryBtnProps}
            >
              {props.secondaryBtnProps.children}
            </Button>
          )}
          {props.primaryBtnProps && (
            <Button
              btnType={ButtonType.primary}
              {...props.primaryBtnProps}
            >
              {props.primaryBtnProps.children}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
