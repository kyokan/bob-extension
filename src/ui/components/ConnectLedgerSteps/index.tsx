import * as React from "react";
import classNames from "classnames";
import "./connect-ledger-steps.scss";

export const DefaultConnectLedgerSteps = (props: {
  completedSteps: boolean[];
}) => {
  return (
    <>
      <LedgerStep
        stepNumber={1}
        stepDescription="Connect your Ledger directly to your computer."
        stepCompleted={props.completedSteps[0]}
      />
      <LedgerStep
        stepNumber={2}
        stepDescription="Enter your secret pin on your Ledger device."
        stepCompleted={props.completedSteps[1]}
      />
      <LedgerStep
        stepNumber={3}
        stepDescription="Select the Handshake app on your Ledger."
        stepCompleted={props.completedSteps[2]}
      />
    </>
  );
};

export default function LedgerStep(props: {
  stepNumber: number;
  stepDescription: string;
  stepCompleted: boolean;
}) {
  return (
    <div className="connect__status-pill">
      <div>
        <small className="connect__status-number">{props.stepNumber}</small>
        <span>
          <small>{props.stepDescription}</small>
        </span>
      </div>
      <div className="connect__status-symbol">
        <span
          className={classNames("ledger-circle-check-container", {
            "ledger-circle-check-container__active": props.stepCompleted,
          })}
        />
      </div>
    </div>
  );
}
