import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {Redirect, Route, Switch, useHistory} from "react-router";
import {useDispatch} from "react-redux";
import semver from "semver";
import {browser} from "webextension-polyfill-ts";
import MessageTypes from "@src/util/messageTypes";
import postMessage from "@src/util/postMessage";
import {createWallet, useInitialized, useWalletIDs} from "@src/ui/ducks/wallet";
import TermsOfUse from "@src/ui/pages/Onboarding/Terms";
import Button, {ButtonType} from "@src/ui/components/Button";
import Checkbox from "@src/ui/components/Checkbox";
import Icon from "@src/ui/components/Icon";
import Input from "@src/ui/components/Input";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import {
  OnboardingModal,
  OnboardingModalContent,
  OnboardingModalFooter,
  OnboardingModalHeader,
} from "@src/ui/components/OnboardingModal";
import {DefaultConnectLedgerSteps} from "@src/ui/components/ConnectLedgerSteps";
import "./onboarding.scss";
import BobIcon from "@src/static/icons/bob-black.png";
import {USB} from "hsd-ledger/lib/hsd-ledger-browser";
import {getAppVersion, getAccountXpub} from "@src/util/withLedger";
import {isSupported} from "@src/util/webusb";
import {
  LEDGER_MINIMUM_VERSION,
  LEDGER_USB_VENDOR_ID,
} from "@src/util/constants";

const {Device} = USB;
const usb = navigator.usb;
const ONE_MINUTE = 60000;
const network = process.env.NETWORK_TYPE || "main";

export default function Onboarding(): ReactElement {
  const [onboardingType, setOnboardingType] = useState<
    "create" | "import" | "connect" | null
  >(null);
  const [walletName, setWalletName] = useState("");
  const [seedphrase, setSeedphrase] = useState("");
  const [password, setPassword] = useState("");
  const [isLedger, setIsLedger] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  const onCreateWallet = useCallback(async (xpub?: string) => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name:
          onboardingType === "create"
            ? "create wallet"
            : onboardingType === "import"
            ? "import wallet"
            : "connect ledger",
      },
    });
    dispatch(
      createWallet({
        walletName,
        seedphrase,
        password,
        optIn,
        isLedger,
        xpub,
      })
    );
    history.push("/");
  }, [walletName, seedphrase, password, optIn, onboardingType, isLedger]);

  return (
    <div className="onboarding">
      <Switch>
        <Route path="/onboarding/welcome">
          <Welcome />
        </Route>
        <Route path="/onboarding/terms">
          <Terms
            onCreateNewWallet={() => setOnboardingType("create")}
            onImportWallet={() => setOnboardingType("import")}
            onConnectWallet={() => setOnboardingType("connect")}
            isConnectLedger={onboardingType === "connect"}
          />
        </Route>
        <Route path="/onboarding/name-your-wallet">
          <NameYourWallet
            walletName={walletName}
            setWalletName={setWalletName}
            isConnectLedger={onboardingType === "connect"}
          />
        </Route>
        <Route path="/onboarding/create-password">
          <CreatePassword
            password={password}
            setPassword={setPassword}
            isConnectLedger={onboardingType === "connect"}
          />
        </Route>
        <Route path="/onboarding/seedphrase-warning">
          <SeedWarning isImporting={onboardingType === "import"} />
        </Route>
        <Route path="/onboarding/reveal-seedphrase">
          <RevealSeedphrase
            seedphrase={seedphrase}
            setSeedphrase={setSeedphrase}
          />
        </Route>
        <Route path="/onboarding/confirm-seedphrase">
          <ConfirmSeedphrase
            seedphrase={seedphrase}
            setSeedphrase={setSeedphrase}
            isImporting={onboardingType === "import"}
          />
        </Route>
        <Route path="/onboarding/opt-in-analytics">
          <OptInAnalytics
            optIn={optIn}
            setOptIn={setOptIn}
            onCreateWallet={onCreateWallet}
            isConnectLedger={onboardingType === "connect"}
          />
        </Route>
        <Route path="/onboarding/connect-ledger">
          <ConnectLedger
            isLedger={isLedger}
            setIsLedger={setIsLedger}
            onCreateWallet={onCreateWallet}
          />
        </Route>
        <Route>
          <Redirect to="/onboarding/welcome" />
        </Route>
      </Switch>
    </div>
  );
}

function Welcome(props: {}): ReactElement {
  const history = useHistory();
  const initialized = useInitialized();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Welcome",
        },
      },
    });
  }, []);

  return (
    <OnboardingModal onClose={() => null}>
      <OnboardingModalHeader
        backBtn={initialized ? "Back" : undefined}
        onBack={initialized ? () => history.push("/") : undefined}
      />
      <OnboardingModalContent center>
        <div
          className="welcome__logo"
          style={{backgroundImage: `url(js/${BobIcon})`}}
        />
        <p>
          <b>Hi, I am Bob (Extension).</b>
        </p>
        <small className="welcome__paragraph">
          I am your Handshake Wallet in a browser extension. I can help you take
          control of your Handshake coins, manage DNS records, and participate
          in domain auctions.
        </small>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => {
            browser.tabs.create({
              url:
                browser.runtime.getURL("popup.html") +
                `#onboarding/terms?type=create`,
            });
          }}
        >
          Create a new wallet
        </Button>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => {
            browser.tabs.create({
              url:
                browser.runtime.getURL("popup.html") +
                `#onboarding/terms?type=import`,
            });
          }}
        >
          Import a wallet
        </Button>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => {
            browser.tabs.create({
              url:
                browser.runtime.getURL("popup.html") +
                `#onboarding/terms?type=connect`,
            });
          }}
        >
          Connect ledger
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function Terms(props: {
  onCreateNewWallet: () => void;
  onImportWallet: () => void;
  onConnectWallet: () => void;
  isConnectLedger: boolean;
}): ReactElement {
  const history = useHistory();
  const [accepted, setAccept] = useState(false);
  const initialized = useInitialized();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Terms",
        },
      },
    });

    const onboardingType = new URL(
      window.location.href.replace("#", "")
    ).searchParams.get("type");

    if (onboardingType === "import") {
      props.onImportWallet();
    } else if (onboardingType === "connect") {
      props.onConnectWallet();
    } else {
      props.onCreateNewWallet();
    }
  }, []);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={1}
        maxStep={props.isConnectLedger ? 5 : 6}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>Terms of use</strong>
          <div className="title__detail">
            <small>
              Please review and agree to the Bob Wallet’s terms of use.
            </small>
          </div>
        </div>
        <TermsOfUse />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <div className="terms__checkbox">
          <Checkbox checked={accepted} onChange={() => setAccept(!accepted)} />
          <small>I accept the terms of use.</small>
        </div>
        <Button
          onClick={() => history.push("/onboarding/name-your-wallet")}
          disabled={!accepted}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function NameYourWallet(props: {
  isConnectLedger: boolean;
  walletName: string;
  setWalletName: (walletName: string) => void;
}): ReactElement {
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState("");
  const walletIDs = useWalletIDs();
  const initialized = useInitialized();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Name Your Wallet",
        },
      },
    });
  }, []);

  const onChange = useCallback(
    (e) => {
      const value = e.target.value;
      setErrorMessage("");
      props.setWalletName(value);

      if (value && !/^[A-Za-z0-9]+$/i.test(value)) {
        setErrorMessage("Can only contain letters and numbers");
      } else if (walletIDs.includes(value)) {
        setErrorMessage(`"${value}" already exists`);
      } else if (value === "primary") {
        setErrorMessage('Cannot set wallet id to "primary"');
      }
    },
    [props.walletName, errorMessage]
  );

  const onBack = useCallback(() => {
    if (props.isConnectLedger) {
      history.push("/onboarding/terms?type=connect");
    } else {
      history.push("/onboarding/terms");
    }
  }, [props.isConnectLedger]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={onBack}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={2}
        maxStep={props.isConnectLedger ? 5 : 6}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>Name your wallet</strong>
          <div className="title__detail">
            <small>
              The name can only contain alphanumeric lowercase characters.
            </small>
          </div>
        </div>

        <Input
          label="Wallet name"
          errorMessage={errorMessage}
          onChange={onChange}
          onKeyDown={(e) =>
            e.key === "Enter" && history.push("/onboarding/create-password")
          }
          value={props.walletName}
        />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => history.push("/onboarding/create-password")}
          disabled={!props.walletName || !!errorMessage}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function CreatePassword(props: {
  isConnectLedger: boolean;
  password: string;
  setPassword: (password: string) => void;
}): ReactElement {
  const history = useHistory();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisibility] = useState(false);
  const initialized = useInitialized();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Create Password",
        },
      },
    });
  }, []);

  useEffect(() => {
    props.setPassword("");
  }, []);

  const onChangePassword = useCallback((e) => {
    const value = e.target.value;
    props.setPassword(value);
  }, []);

  const onSetConfirmPassword = useCallback((e) => {
    const value = e.target.value;
    setConfirmPassword(value);
  }, []);

  const onNext = useCallback(() => {
    if (props.isConnectLedger) {
      history.push("/onboarding/opt-in-analytics");
    } else {
      history.push("/onboarding/seedphrase-warning");
    }
  }, [props.isConnectLedger]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={() => history.push("/onboarding/name-your-wallet")}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={3}
        maxStep={props.isConnectLedger ? 5 : 6}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>Set up a password</strong>
          <div className="title__detail">
            <small>Your password must be at least 8 characters long.</small>
          </div>
        </div>
        <Input
          label="Set password"
          onChange={onChangePassword}
          value={props.password}
          type={visible ? "text" : "password"}
          fontAwesome={visible ? "fa-eye" : "fa-eye-slash"}
          onIconClick={() => setVisibility(!visible)}
        />
        <Input
          label="Confirm password"
          onChange={onSetConfirmPassword}
          value={confirmPassword}
          type={visible ? "text" : "password"}
          fontAwesome={visible ? "fa-eye" : "fa-eye-slash"}
          onIconClick={() => setVisibility(!visible)}
        />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={onNext}
          disabled={
            props.password !== confirmPassword || props.password.length < 8
          }
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function SeedWarning(props: {isImporting: boolean}): ReactElement {
  const {isImporting} = props;
  const history = useHistory();
  const [accepted, setAccept] = useState(false);
  const initialized = useInitialized();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Seed Warning",
        },
      },
    });
  }, []);

  const onNext = useCallback(() => {
    if (props.isImporting) {
      history.push("/onboarding/confirm-seedphrase");
    } else {
      history.push("/onboarding/reveal-seedphrase");
    }
  }, [props.isImporting]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={() => history.push("/onboarding/create-password")}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={4}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>
          {isImporting
            ? "Import your recovery seed phrase"
            : "Back up your recovery seed phrase"}
        </b>
        <p>
          <small>
            {isImporting
              ? "Entering your seed on any website is dangerous. You could lose all your funds if you accidentally visit a phishing website or if your computer is compromised."
              : "Your seed phrase will be generated in the next screen. It will allow you to recover your wallet if lost, stolen, or compromised."}
          </small>
        </p>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <div className="terms__checkbox">
          <Checkbox checked={accepted} onChange={() => setAccept(!accepted)} />
          <small>
            {isImporting
              ? "I understand the risks, let me enter my seed phrase."
              : "I understand that if I lose my seed phrase, I will no longer be able to access my wallet."}
          </small>
        </div>
        <Button onClick={onNext} disabled={!accepted}>
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function RevealSeedphrase(props: {
  seedphrase: string;
  setSeedphrase: (seedphrase: string) => void;
}): ReactElement {
  const history = useHistory();
  const initialized = useInitialized();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Reveal Seedphrase",
        },
      },
    });
  }, []);

  useEffect(() => {
    (async function onRevealSeedphraseMount() {
      const mnemonic = await postMessage({
        type: MessageTypes.GENERATE_NEW_MNEMONIC,
      });
      props.setSeedphrase(mnemonic);
    })();
  }, []);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={() => history.push("/onboarding/seedphrase-warning")}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={5}
        maxStep={6}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>Your Recovery Seed Phrase</strong>
          <div className="title__detail">
            <small>
              Write down these 24 words on paper and keep it safe and secure. Do
              not email or screenshot your seed.{" "}
              <a
                href="https://en.bitcoinwiki.org/wiki/Mnemonic_phrase"
                target="_blank"
              >
                Learn more
              </a>
            </small>
          </div>
        </div>

        <div className="reveal-seed">
          {props.seedphrase.split(" ").map((seed, i) => {
            if (!seed) return null;
            return (
              <div key={i} className="reveal-seed__seed">
                <div className="reveal-seed__seed__index">{`${i + 1}:`}</div>
                <div className="reveal-seed__seed__word">{seed}</div>
              </div>
            );
          })}
        </div>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button onClick={() => history.push("/onboarding/confirm-seedphrase")}>
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function ConfirmSeedphrase(props: {
  seedphrase: string;
  setSeedphrase: (seedphrase: string) => void;
  isImporting: boolean;
}): ReactElement {
  const history = useHistory();
  const initialized = useInitialized();

  const [enteredSeeds, setEnteredSeeds] = useState<string[]>(
    Array(24).fill("")
  );

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Confirm Seedphrase",
        },
      },
    });
  }, []);

  const onEnterSeed = useCallback(
    (word, i) => {
      const newSeeds = enteredSeeds.map((seed, j) => {
        if (i === j) return word;
        return seed;
      });
      setEnteredSeeds(newSeeds);

      if (props.isImporting) {
        props.setSeedphrase(newSeeds.join(" "));
      }
    },
    [enteredSeeds.join(" "), props.isImporting]
  );

  const onBack = useCallback(() => {
    if (props.isImporting) {
      history.push("/onboarding/seedphrase-warning");
    } else {
      history.push("/onboarding/reveal-seedphrase");
    }
  }, [props.isImporting]);

  let disabled = false;
  const nonEmptySeeds = enteredSeeds.filter((s) => !!s);

  if (!props.isImporting && props.seedphrase !== enteredSeeds.join(" ")) {
    disabled = true;
  } else if (
    props.isImporting &&
    nonEmptySeeds.length !== 12 &&
    nonEmptySeeds.length !== 24
  ) {
    disabled = true;
  }

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={onBack}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={5}
        maxStep={6}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>
            {props.isImporting
              ? "Import your recovery phrase"
              : "Confirm your recovery phrase"}
          </strong>
          <div className="title__detail">
            <small>
              {props.isImporting
                ? "Enter your 12- or 24-word seed phrase to restore your wallet."
                : "Enter your 24-word seed phrase from the previous screen."}
            </small>
          </div>
        </div>

        <div className="reveal-seed">
          {Array(24)
            .fill("")
            .map((_, i) => {
              const seed = enteredSeeds[i];

              return (
                <div key={i} className="reveal-seed__seed">
                  <div className="reveal-seed__seed__index">{`${i + 1}:`}</div>
                  <input
                    className="reveal-seed__seed__input"
                    value={seed}
                    onChange={(e) => onEnterSeed(e.target.value, i)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const seeds = e.clipboardData
                        .getData("Text")
                        .split(/\s+/);
                      const newSeeds = enteredSeeds.slice();
                      seeds.forEach((seed, j) => {
                        if (i + j < 24) {
                          newSeeds[i + j] = seed;
                        }
                      });

                      setEnteredSeeds(newSeeds);

                      if (props.isImporting) {
                        props.setSeedphrase(newSeeds.join(" "));
                      }
                    }}
                  />
                </div>
              );
            })}
        </div>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => history.push("/onboarding/opt-in-analytics")}
          disabled={disabled}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function OptInAnalytics(props: {
  isConnectLedger: boolean;
  onCreateWallet: () => Promise<void>;
  optIn: boolean;
  setOptIn: (optIn: boolean) => void;
}): ReactElement {
  const history = useHistory();
  const {optIn, setOptIn} = props;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  const initialized = useInitialized();

  useEffect(() => {
    (async function () {
      const res = await postMessage({
        type: MessageTypes.GET_ANALYTICS,
      });
      setOptIn(res);
    })();
  }, []);

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Opt In Analytics",
        },
      },
    });
  }, []);

  const onCreateWallet = useCallback(async () => {
    setLoading(true);
    try {
      await props.onCreateWallet();
    } catch (e: any) {
      setErrorMessage(e.message);
    }
    setLoading(false);
  }, [props.onCreateWallet]);

  const onBack = useCallback(() => {
    if (props.isConnectLedger) {
      history.push("/onboarding/create-password");
    } else {
      history.push("/onboarding/confirm-seedphrase");
    }
  }, [props.isConnectLedger]);

  const onNext = useCallback(() => {
    if (props.isConnectLedger) {
      history.push("/onboarding/connect-ledger");
    } else {
      onCreateWallet();
    }
  }, [props.isConnectLedger]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={onBack}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={props.isConnectLedger ? 4 : 6}
        maxStep={props.isConnectLedger ? 5 : 6}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>Opt in to analytics</strong>
          <div className="title__detail">
            <small>Do you want to send anonymous usage data to Kyokan?</small>
          </div>
        </div>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <label className="terms__checkbox" htmlFor="optin">
          <Checkbox id="optin" checked={optIn} onChange={() => setOptIn(!optIn)} />
          <small>Yes, opt me in.</small>
        </label>
        <Button onClick={onNext} disabled={loading} loading={loading}>
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}

function ConnectLedger(props: {
  onCreateWallet: (xpub: string) => Promise<void>;
  isLedger: boolean;
  setIsLedger: (isLedger: boolean) => void;
}): ReactElement {
  const {onCreateWallet, isLedger, setIsLedger} = props;
  const history = useHistory();
  const [isConnected, setIsConnected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isHandshakeApp, setIsHandshakeApp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const initialized = useInitialized();

  useEffect(() => {
    setIsLedger(true);
  }, []);

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Onboarding View",
        data: {
          view: "Connect Ledger",
        },
      },
    });
  }, []);

  useEffect(() => {
    async function checkForLedgerDevices() {
      const devices: USBDevice[] = await Device.getDevices();
      const filtered = devices.filter(
        (d) => d.vendorId === LEDGER_USB_VENDOR_ID
      );
      if (filtered[0]) {
        setIsConnected(true);
        setIsUnlocked(true);
        setIsHandshakeApp(true);
        console.log("Ledger connected");
      } else {
        setIsConnected(false);
        setIsUnlocked(false);
        setIsHandshakeApp(false);
        console.log("Ledger disconnected");
      }
    }
    checkForLedgerDevices();

    usb.addEventListener("connect", checkForLedgerDevices);
    usb.addEventListener("disconnect", checkForLedgerDevices);

    return () => {
      usb.removeEventListener("connect", checkForLedgerDevices);
      usb.removeEventListener("disconnect", checkForLedgerDevices);
    };
  }, []);

  const connectToDevice = async () => {
    try {
      const device = await Device.requestDevice();
      await device.set({
        timeout: ONE_MINUTE,
      });

      const appVersion = await getAppVersion(device, network);
      console.log(
        `HNS Ledger app verison is ${appVersion}, minimum is ${LEDGER_MINIMUM_VERSION}`
      );
      if (!semver.gte(appVersion, LEDGER_MINIMUM_VERSION)) {
        setIsLoading(false);
        setErrorMessage(
          `Ledger app version ${LEDGER_MINIMUM_VERSION} is required. (${appVersion} installed)`
        );
        return;
      }

      const accountXpub = await getAccountXpub(device, network);
      return accountXpub
    } catch (e: any) {
      console.error(e);
      setIsLoading(false);
      setErrorMessage(`Error connecting to device. ${e.message}`);
      return;
    }
  };

  const onConnectLedger = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    if (!isSupported) {
      alert("Could not find WebUSB.");
      throw new Error("Could not find WebUSB.");
    }

    const xpub = await connectToDevice()
    await onCreateWallet(xpub)

    setIsLoading(false);
  }, [isLedger]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25} />}
        onBack={() => history.push("/onboarding/opt-in-analytics")}
        onClose={initialized ? () => window.close() : undefined}
        currentStep={5}
        maxStep={5}
      />
      <OnboardingModalContent>
        <div className="title">
          <strong>Connect Ledger</strong>
          <div className="title__detail">
            <small>Connect your hardware wallet.</small>
          </div>
        </div>
        <DefaultConnectLedgerSteps
          completedSteps={[isConnected, isUnlocked, isHandshakeApp]}
        />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <Button
          onClick={onConnectLedger}
          disabled={isLoading}
          loading={isLoading}
        >
          Connect Ledger
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  );
}
