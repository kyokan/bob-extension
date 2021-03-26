import Modal from "@src/ui/components/Modal";
import React, {MouseEventHandler, ReactElement, ReactNode} from "react";
import Icon from "@src/ui/components/Icon";
import c from "classnames";
import "./onboarding-modal.scss";

type Props = {
  onClose?: MouseEventHandler;
  children: ReactNode | ReactNode[];
}

export function OnboardingModal(props: Props) {
  return (
    <Modal className="onboarding-modal" onClose={props.onClose}>
      {props.children}
    </Modal>
  );
}

type HeaderProps = {
  currentStep?: number;
  maxStep?: number;
  backBtn?: ReactNode;
  onBack?: MouseEventHandler;
  onClose?: MouseEventHandler;
}

export function OnboardingModalHeader(props: HeaderProps) {
  const {
    currentStep,
    maxStep,
    backBtn,
    onBack,
    onClose,
  } = props;

  const hasSteps = typeof currentStep !== 'undefined' && typeof maxStep !== 'undefined';

  return (
    <div className="onboarding-modal__header">
      <div
        className="onboarding-modal__header__back"
        onClick={onBack}
      >
        {backBtn}
      </div>
      <div
        className="onboarding-modal__header__actions"
      >
        {
          hasSteps && (
            <div className="onboarding-modal__header__steps">
              {currentStep}/{maxStep}
            </div>
          )
        }
        {
          onClose && (
            <Icon
              fontAwesome="fa-times"
              size={1.25}
            />
          )
        }
      </div>
    </div>
  );
}

type ContentProps = {
  children: ReactNode | ReactNode[];
  center?: boolean;
}

export function OnboardingModalContent(props: ContentProps): ReactElement {
  return (
    <div
      className={c("onboarding-modal__content", {
      'onboarding-modal__content--centered': props.center,
      })}
    >
      {props.children}
    </div>
  )
}


type FooterProps = {
  children: ReactNode | ReactNode[];
}

export function OnboardingModalFooter(props: FooterProps): ReactElement {
  return (
    <div className="onboarding-modal__footer">
      {props.children}
    </div>
  )
}
