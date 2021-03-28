import BigNumber from "bignumber.js";

export const fromDollaryDoos = (raw: number, decimals = 2) => {
  return new BigNumber(raw).dividedBy(10 ** 6).toFixed(decimals);
};

export const toDollaryDoos = (raw: number) => {
  return new BigNumber(raw).multipliedBy(10 ** 6).toFixed(0);
};

export const formatNumber = (num: number | string): string  => {
  if (typeof num === 'number') {
    num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

  if (typeof num === 'string') {
    return num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }

  return '';
}
