import React, {ReactElement, useCallback, useEffect, useState} from "react";
import "./onboarding.scss";
import {Redirect, Route, Switch, useHistory} from "react-router";
import {
  OnboardingModal,
  OnboardingModalContent,
  OnboardingModalFooter,
  OnboardingModalHeader
} from "@src/ui/components/OnboardingModal";
import BobIcon from "@src/static/icons/bob-black.png";
import Button, {ButtonType} from "@src/ui/components/Button";
import Checkbox from "@src/ui/components/Checkbox";
import Icon from "@src/ui/components/Icon";
import TermsOfUse from "@src/ui/pages/Onboarding/terms";
import Input from "@src/ui/components/Input";
import MessageTypes from "@src/util/messageTypes";
import postMessage from "@src/util/postMessage";
import {useInitialized} from "@src/ui/ducks/wallet";

export default function Onboarding(): ReactElement {
  const [onboardingType, setOnboardingType] = useState<'create'|'import'|null>(null);
  const [walletName, setWalletName] = useState('');
  const [seedphrase, setSeedphrase] = useState('');
  const [password, setPassword] = useState('');
  const [optIn, setOptIn] = useState(false);

  const onCreateWallet = useCallback(async () => {
    if (!walletName) throw new Error('Wallet name cannot be empty.');
    if (!seedphrase) throw new Error('Invalid seedphrase.');
    if (!password) throw new Error('Password cannot be empty.');

    const resp = await postMessage({
      type: MessageTypes.CREATE_NEW_WALLET,
      payload: {
        id: walletName,
        mnemonic: seedphrase,
        passphrase: password,
      },
    });

    console.log(resp);
  }, [
    walletName,
    seedphrase,
    password,
    optIn,
  ]);

  return (
    <div className="onboarding">
      <Switch>
        <Route path="/onboarding/welcome">
          <WelcomeStep
            onCreateNewWallet={() => setOnboardingType('create')}
            onImportWallet={() => setOnboardingType('import')}
          />
        </Route>
        <Route path="/onboarding/terms">
          <Terms />
        </Route>
        <Route path="/onboarding/name-your-wallet">
          <NameYourWallet
            walletName={walletName}
            setWalletName={setWalletName}
          />
        </Route>
        <Route path="/onboarding/create-password">
          <CreatePassword
            password={password}
            setPassword={setPassword}
          />
        </Route>
        <Route path="/onboarding/seedphrase-warning">
          <SeedWarning
            isImporting={onboardingType === 'import'}
          />
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
            isImporting={onboardingType === 'import'}
          />
        </Route>
        <Route path="/onboarding/opt-in-analytics">
          <OptInAnalytics
            optIn={optIn}
            setOptIn={setOptIn}
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

function WelcomeStep(props: {
  onCreateNewWallet: () => void;
  onImportWallet: () => void;
}): ReactElement {
  const history = useHistory();
  const initialized = useInitialized();

  return (
    <OnboardingModal
      onClose={() => null}
    >
      <OnboardingModalHeader
        backBtn={initialized ? "Back to login" : undefined}
        onBack={initialized ? () => history.push('/login') : undefined}
      />
      <OnboardingModalContent center>
        <div
          className="welcome__logo"
          style={{backgroundImage: `url(js/${BobIcon})`}}
        />
        <p><b>Hi, I am Bob (Extension).</b></p>
        <small className="welcome__paragraph">
          I am your Handshake Wallet in a browser extension. I can help you take control of your Handshake coins, manage DNS records, and participate in domain auctions.
        </small>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => {
            props.onCreateNewWallet();
            history.push('/onboarding/terms');
          }}
        >
          Create a new wallet
        </Button>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => {
            props.onImportWallet();
            history.push('/onboarding/terms');
          }}
        >
          Import a wallet
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}

function Terms(): ReactElement {
  const history = useHistory();
  const [accepted, setAccept] = useState(false);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={() => history.push('/onboarding/welcome')}
        currentStep={1}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>Terms of use</b>
        <p><small>Please review and agree to the Bob Wallet’s terms of use.</small></p>
        <TermsOfUse />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <div className="terms__checkbox">
          <Checkbox
            checked={accepted}
            onChange={() => setAccept(!accepted)}
          />
          <small>I accept the terms of use.</small>
        </div>
        <Button
          onClick={() => history.push('/onboarding/name-your-wallet')}
          disabled={!accepted}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}

function NameYourWallet(props: {
  walletName: string;
  setWalletName: (walletName: string) => void;
}): ReactElement {
  const history = useHistory();
  const [errorMessage, setErrorMessage] = useState('');

  const onChange = useCallback((e) => {
    const value = e.target.value;
    setErrorMessage('');
    props.setWalletName(value);

    if (value && !(/^[A-Za-z0-9]+$/i.test(value))) {
      setErrorMessage('Can only contain letters and numbers');
    }
  }, [props.walletName, errorMessage]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={() => history.push('/onboarding/terms')}
        currentStep={2}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>Name your wallet</b>
        <p><small>The name can only contain alphanumeric lowercase characters.</small></p>
        <Input
          label="Wallet name"
          errorMessage={errorMessage}
          onChange={onChange}
          value={props.walletName}
        />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => history.push('/onboarding/create-password')}
          disabled={!props.walletName || !!errorMessage}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}

function CreatePassword(props: {
  password: string;
  setPassword: (password: string) => void;
}): ReactElement {
  const history = useHistory();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisibility] = useState(false);

  useEffect(() => {
    props.setPassword('');
  }, []);

  const onChangePassword = useCallback((e) => {
    const value = e.target.value;
    props.setPassword(value);
  }, []);

  const onSetConfirmPassword = useCallback((e) => {
    const value = e.target.value;
    setConfirmPassword(value);
  }, []);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={() => history.push('/onboarding/name-your-wallet')}
        currentStep={3}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>Set up a password</b>
        <p><small>Your password must be at least 8 characters long.</small></p>
        <Input
          label="Set password"
          onChange={onChangePassword}
          value={props.password}
          type={visible ? 'text' : 'password'}
          fontAwesome={visible ? 'fa-eye' : 'fa-eye-slash'}
          onIconClick={() => setVisibility(!visible)}
        />
        <Input
          label="Confirm password"
          onChange={onSetConfirmPassword}
          value={confirmPassword}
          type={visible ? 'text' : 'password'}
          fontAwesome={visible ? 'fa-eye' : 'fa-eye-slash'}
          onIconClick={() => setVisibility(!visible)}
        />
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => history.push('/onboarding/seedphrase-warning')}
          disabled={props.password !== confirmPassword || props.password.length < 8}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}

function SeedWarning(props: {
  isImporting: boolean;
}): ReactElement {
  const { isImporting } = props;
  const history = useHistory();
  const [accepted, setAccept] = useState(false);

  const onNext = useCallback(() => {
    if (props.isImporting) {
      history.push('/onboarding/confirm-seedphrase')
    } else {
      history.push('/onboarding/reveal-seedphrase')
    }
  }, [props.isImporting]);

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={() => history.push('/onboarding/create-password')}
        currentStep={4}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>{isImporting ? 'Import your recovery seed phrase' : 'Back up your recovery seed phrase'}</b>
        <p>
          <small>
          {
            isImporting
              ? 'Entering your seed on any website is dangerous. You could lose all your funds if you accidentally visit a phishing website or if your computer is compromised.'
              : 'Your seed phrase will be generated in the next screen. It will allow you to recover your wallet if lost, stolen, or compromised.'
          }
          </small>
        </p>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <div className="terms__checkbox">
          <Checkbox
            checked={accepted}
            onChange={() => setAccept(!accepted)}
          />
          <small>
            {
              isImporting
                ? 'I understand the risks, let me enter my seed phrase.'
                : 'I understand that if I lose my seed phrase, I will no longer be able to access my wallet.'
            }
          </small>
        </div>
        <Button
          onClick={onNext}
          disabled={!accepted}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}

function RevealSeedphrase(props: {
  seedphrase: string;
  setSeedphrase: (seedphrase: string) => void;
}): ReactElement {
  const history = useHistory();

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
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={() => history.push('/onboarding/seedphrase-warning')}
        currentStep={5}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>Your Recovery Seed Phrase</b>
        <p><small>Write down these 24 words on paper and keep it safe and secure. Do not email or screenshot your seed. <a href="https://en.bitcoinwiki.org/wiki/Mnemonic_phrase" target="_blank">Learn more</a></small></p>
        <div className="reveal-seed">
          {props.seedphrase.split(' ').map((seed, i) => {
            return (
              <div className="reveal-seed__seed">
                <div className="reveal-seed__seed__index">{`${i+1}:`}</div>
                <div className="reveal-seed__seed__word">{seed}</div>
              </div>
            )
          })}
        </div>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => history.push('/onboarding/confirm-seedphrase')}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}


function ConfirmSeedphrase(props: {
  seedphrase: string;
  isImporting: boolean;
}): ReactElement {
  const history = useHistory();

  const [enteredSeeds, setEnteredSeeds] = useState<string[]>(Array(24).fill(''));

  const onEnterSeed = useCallback((word, i) => {
    const newSeeds = enteredSeeds.map((seed, j) => {
      if (i === j) return word;
      return seed;
    });
    setEnteredSeeds(newSeeds);
  }, [enteredSeeds.join(' ')]);

  const onBack = useCallback(() => {
    if (props.isImporting) {
      history.push('/onboarding/seedphrase-warning');
    } else {
      history.push('/onboarding/reveal-seedphrase');
    }
  }, [props.isImporting]);

  let disabled = false;
  const nonEmptySeeds = enteredSeeds.filter(s => !!s);

  if (!props.isImporting && props.seedphrase !== enteredSeeds.join(' ')) {
    disabled = true;
  } else if (props.isImporting && nonEmptySeeds.length !== 12 && nonEmptySeeds.length !== 24) {
    disabled = true;
  }

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={onBack}
        currentStep={5}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>
          {
            props.isImporting
              ? 'Import your recovery phrase'
              : 'Confirm your recovery phrase'
          }
        </b>
        <p>
          <small>
            {
              props.isImporting
                ? 'Enter your 12- or 24-word seed phrase to restore your wallet.'
                : 'Enter your 24-word seed phrase from the previous screen.'
            }
          </small>
        </p>
        <div className="reveal-seed">
          {Array(24).fill('').map((_, i) => {
            const seed = enteredSeeds[i];
            return (
              <div className="reveal-seed__seed">
                <div className="reveal-seed__seed__index">{`${i+1}:`}</div>
                <input
                  className="reveal-seed__seed__input"
                  value={seed}
                  onChange={e => onEnterSeed(e.target.value, i)}
                  onPaste={e => {
                    e.preventDefault();
                    const seeds = e.clipboardData.getData('Text').split(/\s+/);
                    const newSeeds = enteredSeeds.slice();
                    seeds.forEach((seed, j) => {
                      if (i + j < 24) {
                        newSeeds[i+j] = seed;
                      }
                    });
                    setEnteredSeeds(newSeeds);
                  }}
                />
              </div>
            )
          })}
        </div>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <Button
          onClick={() => history.push('/onboarding/opt-in-analytics')}
          disabled={disabled}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}

function OptInAnalytics(props: {
  onCreateWallet: () => Promise<void>;
  optIn: boolean;
  setOptIn: (optIn: boolean) => void;
}): ReactElement {
  const history = useHistory();
  const { optIn, setOptIn, onCreateWallet } = props;

  return (
    <OnboardingModal>
      <OnboardingModalHeader
        backBtn={<Icon fontAwesome="fa-arrow-left" size={1.25}/>}
        onBack={() => history.push('/onboarding/confirm-seedphrase')}
        currentStep={6}
        maxStep={6}
      />
      <OnboardingModalContent>
        <b>Opt in to analytics</b>
        <p>
          <small>
            Do you want to send anonymous usage data to Kyokan?
          </small>
        </p>
      </OnboardingModalContent>
      <OnboardingModalFooter>
        <div className="terms__checkbox">
          <Checkbox
            checked={optIn}
            onChange={() => setOptIn(!optIn)}
          />
          <small>
            Yes, opt me in.
          </small>
        </div>
        <Button
          onClick={onCreateWallet}
        >
          Next
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}
