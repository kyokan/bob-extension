import React, {ReactElement, useCallback, useState} from "react";
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

export default function Onboarding(): ReactElement {
  const [onboardingType, setOnboardingType] = useState<'create'|'import'|null>(null);
  const [walletName, setWalletName] = useState('');
  const [seedphrase, setSeedphrase] = useState('');
  const [password, setPassword] = useState('');
  const [optIn, setOptIn] = useState(false);

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

  return (
    <OnboardingModal
      onClose={() => null}
    >
      <OnboardingModalHeader />
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
        maxStep={5}
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
        maxStep={5}
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
        onBack={() => history.push('/onboarding/terms')}
        currentStep={3}
        maxStep={5}
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
