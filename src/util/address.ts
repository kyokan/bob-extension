const protocol = require('hsd/lib/protocol');
const Address = require('hsd/lib/primitives/address');
const networkType = process.env.NETWORK_TYPE || 'main';
const isValidAddress = (address: string) => {
  const {networks} = protocol;
  const inputAddressPrefix = address.slice(0, 2);
  const expectedAddressPrefix = networks[networkType].addressPrefix;

  if (inputAddressPrefix !== expectedAddressPrefix) {
    return false;
  }
  
  try {
    new Address(address);
    return true;
  } catch (e) {
    return false;
  }
};

export const ellipsify = (data: string, first = 6, last = 6) => {
  return `${data.slice(0, first)}...${data.slice(-last)}`
}

export default isValidAddress;
