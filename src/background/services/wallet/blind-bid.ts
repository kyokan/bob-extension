const Struct = require('bufio/lib/struct');
const consensus = require("hsd/lib/protocol/consensus");
const Outpoint = require("hsd/lib/primitives/outpoint");

/**
 * Blind Bid
 */
export default class BlindBid extends Struct {
  constructor() {
    super();
    this.name = Buffer.alloc(0);
    this.nameHash = consensus.ZERO_HASH;
    this.prevout = new Outpoint();
    this.value = -1;
    this.lockup = 0;
    this.blind = consensus.ZERO_HASH;
    this.own = false;
  }

  getSize() {
    return 1 + this.name.length + 41;
  }

  write(bw: any) {
    bw.writeU8(this.name.length);
    bw.writeBytes(this.name);
    bw.writeU64(this.lockup);
    bw.writeBytes(this.blind);
    bw.writeU8(this.own ? 1 : 0);
    return bw;
  }

  read(br: any) {
    this.name = br.readBytes(br.readU8());
    this.lockup = br.readU64();
    this.blind = br.readBytes(32);
    this.own = br.readU8() === 1;
    return this;
  }

  getJSON() {
    return {
      name: this.name.toString('ascii'),
      nameHash: this.nameHash.toString('hex'),
      prevout: this.prevout.toJSON(),
      value: this.value === -1 ? undefined : this.value,
      lockup: this.lockup,
      blind: this.blind.toString('hex'),
      own: this.own
    };
  }
}
