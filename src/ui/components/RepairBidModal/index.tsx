import React, {ReactElement, useCallback, useState} from "react";
import SmallModal from "@src/ui/components/SmallModal";
import {ModalProps} from "@src/ui/components/Modal";
import Input from "@src/ui/components/Input";
import {setBlindByHash, useTXByHash} from "@src/ui/ducks/transactions";
import Button from "@src/ui/components/Button";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {getBidAddress, getBidBlind, getBidValue, getTXNameHash} from "@src/util/transaction";
import {toDollaryDoos} from "@src/util/number";
import {useDispatch} from "react-redux";
import "./repair-bid.scss";

type Props = {
  txHash: string;
} & ModalProps;

export default function RepairBidModal(props: Props): ReactElement {
  const [bidValue, setBidValue] = useState<number>();
  const [error, setError] = useState('');
  const tx = useTXByHash(props.txHash);
  const nameHash = getTXNameHash(tx!);
  const bid = getBidValue(tx!);
  const blind = getBidBlind(tx!);
  const addr = getBidAddress(tx!);
  const dispatch = useDispatch();

  const repairBid = useCallback(async (e) => {
    try {
      const attempt = await postMessage({
        type: MessageTypes.GET_NONCE,
        payload: {
          name: nameHash,
          address: addr,
          bid: +toDollaryDoos(bidValue || 0),
        },
      });

      if (attempt.blind === blind) {
        await postMessage({
          type: MessageTypes.IMPORT_NONCE,
          payload: {
            name: nameHash,
            address: addr,
            value: +toDollaryDoos(bidValue || 0),
          },
        });

        dispatch(setBlindByHash({
          nonce: attempt.nonce,
          value: attempt.bid,
        }, props.txHash));

        props.onClose && props.onClose(e);
      } else {
        setError('Invalid bid value');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [bid, bidValue, dispatch]);

  return (
    <SmallModal onClose={props.onClose}>
      <p>Please enter your actual bid value in HNS.</p>
      <Input
        label="Bid Value"
        type="number"
        value={bidValue}
        onChange={e => setBidValue(+e.target.value)}
        onKeyUp={e => e.key === 'Enter' && repairBid(e)}
      />
      { error && <small className="error-message">{error}</small> }
      <Button
        className="repair-bid__cta"
        small
        onClick={repairBid}
      >
        Submit
      </Button>
    </SmallModal>
  );
}
