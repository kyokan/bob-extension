const protocol = require('hsd/lib/protocol');
const Address = require('hsd/lib/primitives/address');

const isValidAddress = (address: string) => {
  const {networks} = protocol;
  const inputAddressPrefix = address.slice(0, 2);
  const expectedAddressPrefix = networks['main'].addressPrefix;
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

export default isValidAddress;
