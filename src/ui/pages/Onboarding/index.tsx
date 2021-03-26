import React, {ReactElement} from "react";
import "./onboarding.scss";
import {Redirect, Route, Switch} from "react-router";
import {
  OnboardingModal,
  OnboardingModalContent,
  OnboardingModalFooter,
  OnboardingModalHeader
} from "@src/ui/components/OnboardingModal";
import BobIcon from "@src/static/icons/bob-black.png";
import Button, {ButtonType} from "@src/ui/components/Button";

export default function Onboarding(): ReactElement {
  return (
    <div className="onboarding">
      <Switch>
        <Route
          path="/onboarding/welcome"
          component={WelcomeStep}
        />
        <Route>
          <Redirect to="/onboarding/welcome" />
        </Route>
      </Switch>
    </div>
  );
}

function WelcomeStep(): ReactElement {
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
        <Button>
          Create a new wallet
        </Button>
        <Button btnType={ButtonType.secondary}>
          Import a wallet
        </Button>
      </OnboardingModalFooter>
    </OnboardingModal>
  )
}
