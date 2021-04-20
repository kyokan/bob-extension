import React, {ReactElement, useCallback, useState} from "react";
import "./update-tx.scss";
import {useQueuedTXByHash} from "@src/ui/ducks/queue";
import {RegularView, RegularViewContent, RegularViewFooter, RegularViewHeader} from "@src/ui/components/RegularView";
import Button, {ButtonType} from "@src/ui/components/Button";
import {getTXAction, getTXRecipient, getTXValue} from "@src/util/transaction";
import {useWalletBalance} from "@src/ui/ducks/wallet";
import isValidAddress from "@src/util/address";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {fromDollaryDoos, toDollaryDoos} from "@src/util/number";
import Input from "@src/ui/components/Input";
import MaxIcon from "@src/static/icons/max.svg";
import Select from "@src/ui/components/Select";

type Props = {
  hash: string;
  onCancel: () => void;
}

export default function UpdateTx(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const action = getTXAction(pendingTx);

  switch (action) {
    case 'SEND':
      return <UpdateSend {...props} />;
  }

  return <></>;
}

const FEE_TYPE_TO_OPT: {[k: string]: number} = {
  slow: 0.01,
  standard: 0.05,
  fast: 0.1,
};

const FEE_TO_FEE_TYPE: {[k: string]: 'slow' | 'standard' | 'fast'} = {
  '0.01': 'slow',
  '0.05': 'standard',
  '0.1': 'fast',
};


function UpdateSend(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);

  const [amount, setAmount] = useState<number>(+fromDollaryDoos(Math.abs(getTXValue(pendingTx)), 6));
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [address, setAddress] = useState(getTXRecipient(pendingTx));
  const [addressInputErr, setAddressInputErr] = useState('');
  const {spendable} = useWalletBalance();
  const [sending, setSending] = useState(false);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const onAddressChange = useCallback(e => {
    setAddress(e.target.value);
    if (!isValidAddress(e.target.value)) {
      setAddressInputErr('Invalid address');
    } else {
      setAddressInputErr('');
    }
  }, []);

  const setMax = useCallback(async () => {
    const tx = await postMessage({
      type: MessageTypes.CREATE_TX,
      payload: {
        rate: +toDollaryDoos(fee),
        outputs: [{
          value: +toDollaryDoos(0.1),
          address: 'hs1q7q3h4chglps004u3yn79z0cp9ed24rfr5ka9n5',
        }],
      }
    });
    setAmount(+fromDollaryDoos(spendable - tx.fee, 6));
  }, [address, fee, amount, spendable]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_TX,
        payload: {
          rate: +toDollaryDoos(fee),
          outputs: [{
            value: +toDollaryDoos(amount || 0),
            address: address,
          }],
        }
      });
      await postMessage({
        type: MessageTypes.UPDATE_TX_FROM_QUEUE,
        payload: {
          oldJSON: pendingTx,
          txJSON: tx,
        },
      });
      props.onCancel();
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }, [address, fee, amount]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send HNS
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="Recipient"
          onChange={onAddressChange}
          errorMessage={addressInputErr}
          value={address}
          spellCheck={false}
        />
        <Input
          className="send-tx__input send-tx__amount-input"
          label="Amount"
          type="number"
          url={MaxIcon}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          onIconClick={setMax}
        />
        <div className="send-tx__select">
          <div className="send-tx__select__label">Network Fee</div>
          <div className="send-tx__select__content">
            <Select
              options={[
                {value: 'slow', children: 'Slow'},
                {value: 'standard', children: 'Standard'},
                {value: 'fast', children: 'Fast'},
              ]}
              onChange={onChangeFeeOption}
              value={feeType}
            />
            <Input
              type="number"
              value={fee}
              onChange={e => setFee(Number(e.target.value))}
            />
          </div>
        </div>

      </RegularViewContent>
      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          disabled={sending || !amount || amount < 0 || !isValidAddress(address)}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  )
}
