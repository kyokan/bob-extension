import React, {ReactElement, useCallback, useEffect, useState} from "react";
import "./update-tx.scss";
import {useQueuedTXByHash} from "@src/ui/ducks/queue";
import {RegularView, RegularViewContent, RegularViewFooter, RegularViewHeader} from "@src/ui/components/RegularView";
import Button, {ButtonType} from "@src/ui/components/Button";
import {getTXAction, getTXNameHash, getTXRecipient, getTXRecords, getTXValue} from "@src/util/transaction";
import {useWalletBalance} from "@src/ui/ducks/wallet";
import isValidAddress from "@src/util/address";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {fromDollaryDoos, toDollaryDoos} from "@src/util/number";
import Input from "@src/ui/components/Input";
import MaxIcon from "@src/static/icons/max.svg";
import Select from "@src/ui/components/Select";
import {toASCII, toUnicode} from "@src/util/name";
const {Resource} = require('hsd/lib/dns/resource');

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
    case 'OPEN':
      return <UpdateOpen {...props} />;
    case 'BID':
      return <UpdateBid {...props} />;
    case 'REVEAL':
      return <UpdateReveal {...props} />;
    case 'REDEEM':
      return <UpdateRedeem {...props} />;
    case 'REGISTER':
      return <UpdateRegister {...props} />;
    case 'UPDATE':
      return <UpdateUpdate {...props} />;
    default:
      return <UpdateRaw {...props} />;
  }
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
      type: MessageTypes.CREATE_SEND,
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
        type: MessageTypes.CREATE_SEND,
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
  );
}

function UpdateBid(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const nameHash = getTXNameHash(pendingTx);
  const [name, setName] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(
    pendingTx.bid || +fromDollaryDoos(Math.abs(getTXValue(pendingTx)), 6)
  );
  const [blindAmount, setBlindAmount] = useState<number>(
    pendingTx.bid
      ? +fromDollaryDoos(Math.abs(getTXValue(pendingTx)), 6) - pendingTx.bid
      : 0
  );
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })()
  }, [nameHash]);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_BID,
        payload: {
          name: toASCII(name),
          amount: bidAmount,
          lockup: bidAmount + blindAmount,
          feeRate: +toDollaryDoos(fee),
        },
      });
      await postMessage({
        type: MessageTypes.UPDATE_TX_FROM_QUEUE,
        payload: {
          oldJSON: pendingTx,
          txJSON: {
            ...tx,
            bid: bidAmount,
          },
        },
      });
      props.onCancel();
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }, [fee, bidAmount, blindAmount, name]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Bid
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="TLD"
          value={name}
          disabled
        />
        <Input
          className="send-tx__input send-tx__amount-input"
          label="Bid Amount"
          type="number"
          value={bidAmount}
          onChange={e => setBidAmount(Number(e.target.value))}
        />
        <Input
          className="send-tx__input send-tx__amount-input"
          label="Blind Amount"
          type="number"
          value={blindAmount}
          onChange={e => setBlindAmount(Number(e.target.value))}
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
          disabled={sending || !bidAmount || bidAmount < 0}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}

function UpdateOpen(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const nameHash = getTXNameHash(pendingTx);
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })()
  }, [nameHash]);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_OPEN,
        payload: {
          name: toASCII(name),
          rate: +toDollaryDoos(fee),
        },
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
  }, [fee, name]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Open
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="TLD"
          value={name}
          disabled
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
          disabled={sending}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}

function UpdateReveal(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const nameHash = getTXNameHash(pendingTx);
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })()
  }, [nameHash]);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_REVEAL,
        payload: {
          name: toASCII(name),
          rate: +toDollaryDoos(fee),
        },
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
  }, [fee, name]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Reveal
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="TLD"
          value={name}
          disabled
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
          disabled={sending}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}


function UpdateRedeem(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const nameHash = getTXNameHash(pendingTx);
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })()
  }, [nameHash]);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_REDEEM,
        payload: {
          name: toASCII(name),
          rate: +toDollaryDoos(fee),
        },
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
  }, [fee, name]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Redeem
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="TLD"
          value={name}
          disabled
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
          disabled={sending}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}


function UpdateRegister(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const nameHash = getTXNameHash(pendingTx);
  const raw = getTXRecords(pendingTx);
  const {records} = Resource.fromRaw(Buffer.from(raw, 'hex')).toJSON();
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })()
  }, [nameHash]);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_UPDATE,
        payload: {
          name: toASCII(name),
          data: {
            records,
          },
          rate: +toDollaryDoos(fee),
        },
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
  }, [fee, name, raw]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Register
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="TLD"
          value={name}
          disabled
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
          disabled={sending}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}

function UpdateUpdate(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const nameHash = getTXNameHash(pendingTx);
  const raw = getTXRecords(pendingTx);
  const {records} = Resource.fromRaw(Buffer.from(raw, 'hex')).toJSON();
  const [name, setName] = useState('');
  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })()
  }, [nameHash]);

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_UPDATE,
        payload: {
          name: toASCII(name),
          data: {
            records,
          },
          rate: +toDollaryDoos(fee),
        },
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
  }, [fee, name, raw]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Update
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          className="send-tx__input"
          label="TLD"
          value={name}
          disabled
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
          disabled={sending}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}

function UpdateRaw(props: Props): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);

  const [fee, setFee] = useState<number>(FEE_TYPE_TO_OPT.standard);
  const [feeType, _setFeeType] = useState<'slow' | 'standard' | 'fast'>("standard");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onChangeFeeOption = useCallback((e) => {
    _setFeeType(e.target.value);
    const feeOption = FEE_TYPE_TO_OPT[e.target.value] || 2;
    setFee(feeOption);
  },[]);

  const addTX = useCallback(async () => {
    setSending(true);
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_TX,
        payload: {
          ...pendingTx,
          rate: +toDollaryDoos(fee),
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
      setErrorMessage(e.message);
    }
    setSending(false);
  }, [fee]);

  return (
    <RegularView>
      <RegularViewHeader>
        Send Raw Transaction
      </RegularViewHeader>
      <RegularViewContent>
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
      {errorMessage && <small className="error-message">{errorMessage}</small>}
      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          disabled={sending}
          onClick={addTX}
          loading={sending}
        >
          Next
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}
