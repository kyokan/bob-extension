const Validator = require('bval');
const Address = require("hsd/lib/primitives/address");

export default class TransactionOptions {
  /**
   * TransactionOptions
   * @alias module:http.TransactionOptions
   * @constructor
   * @param {Validator} valid
   */

  constructor(valid) {
    if (valid)
      return this.fromValidator(valid);
  }

  /**
   * Inject properties from Validator.
   * @private
   * @param {Validator} valid
   * @returns {TransactionOptions}
   */

  fromValidator(valid) {
    this.rate = valid.u64('rate');
    this.maxFee = valid.u64('maxFee');
    this.selection = valid.str('selection');
    this.smart = valid.bool('smart');
    this.account = valid.str('account');
    this.locktime = valid.u64('locktime');
    this.sort = valid.bool('sort');
    this.subtractFee = valid.bool('subtractFee');
    this.subtractIndex = valid.i32('subtractIndex');
    this.depth = valid.u32(['confirmations', 'depth']);
    this.paths = valid.bool('paths');
    this.outputs = [];

    if (valid.has('outputs')) {
      const outputs = valid.array('outputs');

      for (const output of outputs) {
        const valid = new Validator(output);

        let addr = valid.str('address');

        if (addr)
          addr = Address.fromString(addr, this.network);

        let covenant = valid.obj('covenant');

        if (covenant)
          covenant = Covenant.fromJSON(covenant);

        this.outputs.push({
          value: valid.u64('value'),
          address: addr,
          covenant: covenant
        });
      }
    }

    return this;
  }

  /*
   * Instantiate transaction options
   * from Validator.
   * @param {Validator} valid
   * @returns {TransactionOptions}
   */

  static fromValidator(valid) {
    // @ts-ignore
    return new this().fromValidator(valid);
  }
}
