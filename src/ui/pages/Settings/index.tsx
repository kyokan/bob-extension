import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  RegularView,
  RegularViewContent,
  RegularViewHeader,
} from "@src/ui/components/RegularView";
import {Route, Switch, useHistory} from "react-router";
import Icon from "@src/ui/components/Icon";
import "./settings.scss";
import Input from "@src/ui/components/Input";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Button, {ButtonProps, ButtonType} from "@src/ui/components/Button";
import {useCurrentWallet, useWalletState} from "@src/ui/ducks/wallet";
import Modal from "@src/ui/components/Modal";
import Textarea from "@src/ui/components/Textarea";
import SwitchButton from "@src/ui/components/SwitchButton";

const pkg = require("../../../../package.json");

export default function Settings(): ReactElement {
  const history = useHistory();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Settings",
        },
      },
    });
  }, []);

  return (
    <RegularView className="settings">
      <Switch>
        <Route path="/settings/network">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Network</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/wallet">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Wallet</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/security">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Security</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/about">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">About</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings">
          <RegularViewHeader onClose={() => history.push("/")}>
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
          <Route path="/settings/security">
            <SecurityContent />
          </Route>
          <Route path="/settings/about">
            <SettingGroup name="Version">{pkg.version}</SettingGroup>
          </Route>
          <Route path="/settings">
            <SettingsSelectContent />
          </Route>
        </Switch>
      </RegularViewContent>
    </RegularView>
  );
}

function NetworkContent(): ReactElement {
  const [rpcUrl, setRPCUrl] = useState("");
  const [defaultRpcUrl, setDefaultRPCUrl] = useState("");
  const [rpcAPIKey, setAPIKey] = useState("");
  const [defaultRpcAPIKey, setDefaultAPIKey] = useState("");
  const [rpcURLError, setRPCUrlError] = useState("");
  const [rpcAPIKeyError, setRPCApiKeyError] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [savingAPIKey, setSavingApiKey] = useState(false);
  const [activeResolver, setActiveResolver] = useState(false);

  useEffect(() => {
    (async function onNetworkContentMount() {
      const {apiHost, apiKey} = await postMessage({
        type: MessageTypes.GET_API,
      });
      setDefaultRPCUrl(apiHost);
      setRPCUrl(apiHost);
      setAPIKey(apiKey);
      setDefaultAPIKey(apiKey);
    })();
  }, []);

  useEffect(() => {
    (async function () {
      const optIn = await postMessage({
        type: MessageTypes.GET_RESOLVER,
      });
      setActiveResolver(optIn);
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

  const updateResolver = useCallback(
    async (e) => {
      await postMessage({
        type: MessageTypes.SET_RESOLVER,
        payload: e.target.checked,
      });
      const optIn = await postMessage({
        type: MessageTypes.GET_RESOLVER,
      });
      setActiveResolver(optIn);
    },
    [activeResolver]
  );

  return (
    <>
      <SettingGroup
        name="RPC URL"
        primaryBtnProps={{
          children: "Save",
          onClick: onSaveURL,
          disabled: defaultRpcUrl === rpcUrl || savingUrl,
          loading: savingUrl,
        }}
      >
        <Input
          value={rpcUrl}
          errorMessage={rpcURLError}
          onChange={(e) => setRPCUrl(e.target.value)}
        />
      </SettingGroup>
      <SettingGroup
        name="RPC API Key"
        primaryBtnProps={{
          children: "Save",
          onClick: onSaveAPIKey,
          disabled: defaultRpcAPIKey === rpcAPIKey || savingAPIKey,
          loading: savingAPIKey,
        }}
      >
        <Input
          value={rpcAPIKey}
          errorMessage={rpcAPIKeyError}
          onChange={(e) => setAPIKey(e.target.value)}
        />
      </SettingGroup>
      <SettingGroup
        name="HNS Resolver"
        switchBtnProps={{
          update: updateResolver,
          active: activeResolver,
        }}
      >
        <small>Resolve DNS over Handshake.</small>
      </SettingGroup>
    </>
  );
}

function WalletContent(): ReactElement {
  const {rescanning} = useWalletState();

  const rescan = useCallback(() => {
    if (rescanning) return;

    postMessage({
      type: MessageTypes.FULL_RESCAN,
    });
  }, [rescanning]);

  const stopRescan = useCallback(() => {
    if (!rescanning) return;

    postMessage({
      type: MessageTypes.STOP_RESCAN,
    });
  }, [rescanning]);

  return (
    <>
      <SettingGroup
        name="Rescan"
        primaryBtnProps={{
          children: rescanning ? "Stop Rescan" : "Rescan",
          onClick: rescanning ? stopRescan : rescan,
          // loading: rescanning,
        }}
      >
        <small>Perform a full rescan.</small>
      </SettingGroup>
    </>
  );
}

function SecurityContent(): ReactElement {
  const [isShowingRevealModal, setShowingRevealModal] = useState(false);
  const [password, setPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [optInAnalytics, setOptInAnalytics] = useState(false);

  useEffect(() => {
    (async function () {
      const optIn = await postMessage({
        type: MessageTypes.GET_ANALYTICS,
      });
      setOptInAnalytics(optIn);
    })();
  }, []);

  const updateAnalytics = useCallback(
    async (e) => {
      await postMessage({
        type: MessageTypes.SET_ANALYTICS,
        payload: e.target.checked,
      });
      const optIn = await postMessage({
        type: MessageTypes.GET_ANALYTICS,
      });
      setOptInAnalytics(optIn);
    },
    [optInAnalytics]
  );

  const revealSeed = useCallback(async () => {
    try {
      const mnemonic = await postMessage({
        type: MessageTypes.REVEAL_SEED,
        payload: password,
      });
      setMnemonic(mnemonic);
      setRevealError("");
    } catch (e) {
      setRevealError(e.message);
    }
  }, [password]);

  const closeRevealModal = useCallback(() => {
    setMnemonic("");
    setPassword("");
    setRevealError("");
    setShowingRevealModal(false);
  }, []);

  return (
    <>
      {isShowingRevealModal && (
        <Modal className="confirm-modal reveal-seed" onClose={closeRevealModal}>
          {mnemonic ? (
            <>
              <p>Reveal your seed phrase</p>
              <small>
                You need this to restore your wallet if use change browser or
                computer.
              </small>
              <Textarea value={mnemonic} />
              <Button
                className="reveal-seed__confirm-button"
                onClick={closeRevealModal}
                small
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <p>Reveal your seed phrase</p>
              <small>
                You need this to restore your wallet if use change browser or
                computer.
              </small>
              <Input
                type="password"
                className="reveal-seed__password-input"
                label="Enter password to continue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {revealError && (
                <small className="error-message">{revealError}</small>
              )}
              <Button
                className="reveal-seed__confirm-button"
                disabled={!password}
                onClick={revealSeed}
                small
              >
                Reveal Seedphrase
              </Button>
            </>
          )}
        </Modal>
      )}
      <SettingGroup
        name="Reveal Seedphrase"
        primaryBtnProps={{
          children: "Reveal",
          onClick: () => setShowingRevealModal(true),
        }}
      >
        <small>Reveal wallet seed phrase.</small>
      </SettingGroup>
      <SettingGroup
        name="Analytics Opt-in"
        switchBtnProps={{
          update: updateAnalytics,
          active: optInAnalytics,
        }}
      >
        <small>Send analytics to Kyokan to help improve Bob.</small>
      </SettingGroup>
    </>
  );
}

function SettingsSelectContent(): ReactElement {
  const history = useHistory();

  return (
    <>
      <SettingSelectGroup
        name="Network"
        description="Edit RPC network"
        onClick={() => history.push("/settings/network")}
      />
      <SettingSelectGroup
        name="Wallet"
        description="Rescan, backup, seed phrase"
        onClick={() => history.push("/settings/wallet")}
      />
      <SettingSelectGroup
        name="Security &amp; Privacy"
        description="Privacy settings and wallet seed phrase"
        onClick={() => history.push("/settings/security")}
      />
      <SettingSelectGroup
        name="About"
        description="Version and general info"
        onClick={() => history.push("/settings/about")}
      />
    </>
  );
}

type SelectGroupProps = {
  name: string;
  description: string;
  onClick: () => void;
  hover?: boolean;
};

function SettingSelectGroup(props: SelectGroupProps) {
  return (
    <div
      className="setting-group  setting-group--clickable"
      onClick={props.onClick}
    >
      <div className="setting-group__l">
        <div className="setting-group__title">{props.name}</div>
        <div className="setting-group__description">{props.description}</div>
      </div>
      <Icon fontAwesome="fa-chevron-right" size={1} />
    </div>
  );
}

type GroupProps = {
  name: string;
  children: ReactNode;
  primaryBtnProps?: ButtonProps;
  secondaryBtnProps?: ButtonProps;
  switchBtnProps?: {
    update: (e: any) => Promise<void>;
    active: boolean;
  };
};

function SettingGroup(props: GroupProps) {
  return (
    <div className="setting-group">
      <div className="setting-group__l">
        <div className="setting-group__title">{props.name}</div>
        <div className="setting-group__row">
          <div className="setting-group__children">{props.children}</div>
          <div className="setting-group__actions">
            {props.switchBtnProps && (
              <SwitchButton
                className="setting-group__toggle"
                onChange={props.switchBtnProps.update}
                checked={props.switchBtnProps.active}
              />
            )}
            {props.secondaryBtnProps && (
              <Button
                btnType={ButtonType.secondary}
                {...props.secondaryBtnProps}
              >
                {props.secondaryBtnProps.children}
              </Button>
            )}
            {props.primaryBtnProps && (
              <Button btnType={ButtonType.primary} {...props.primaryBtnProps}>
                {props.primaryBtnProps.children}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
