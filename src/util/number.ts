import BigNumber from "bignumber.js";
import moment from "moment";
const Network = require("hsd/lib/protocol/network");
const network = Network.get('main');

export const fromDollaryDoos = (raw: number, decimals = 2) => {
  if (isNaN(raw)) return '';

  return new BigNumber(raw).dividedBy(10 ** 6).toFixed(decimals);
};

export const toDollaryDoos = (raw: number) => {
  if (isNaN(raw)) return '';

  return new BigNumber(raw).multipliedBy(10 ** 6).toFixed(0);
};

export const formatNumber = (num: number | string): string  => {
  const numText = typeof num === 'string' ? num : num.toString();
  const [first, decimals] = numText.split('.');
  const realNum = first.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

  if (decimals) {
    return `${realNum}.${decimals}`;
  }

  return realNum;
};

export const heightToMoment = (blockHeight: number) => {
  return moment(1583164278000).add(blockHeight * (network.pow.targetSpacing * 1000));
};
