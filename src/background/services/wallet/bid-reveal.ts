const Struct = require('bufio/lib/struct');
const consensus = require("hsd/lib/protocol/consensus");
const Outpoint = require("hsd/lib/primitives/outpoint");

/**
 * Bid Reveal
 */

export default class BidReveal extends Struct {
  constructor() {
    super();
    this.name = Buffer.alloc(0);
    this.nameHash = consensus.ZERO_HASH;
    this.prevout = new Outpoint();
    this.value = 0;
    this.height = -1;
    this.own = false;
  }

  getSize() {
    return 1 + this.name.length + 13;
  }

  write(bw: any) {
    let height = this.height;

    if (height === -1)
      height = 0xffffffff;

    bw.writeU8(this.name.length);
    bw.writeBytes(this.name);
    bw.writeU64(this.value);
    bw.writeU32(height);
    bw.writeU8(this.own ? 1 : 0);

    return bw;
  }

  read(br: any) {
    this.name = br.readBytes(br.readU8());
    this.value = br.readU64();
    this.height = br.readU32();
    this.own = br.readU8() === 1;

    if (this.height === 0xffffffff)
      this.height = -1;

    return this;
  }

  getJSON() {
    return {
      name: this.name.toString('ascii'),
      nameHash: this.nameHash.toString('hex'),
      prevout: this.prevout.toJSON(),
      value: this.value,
      height: this.height,
      own: this.own
    };
  }
}
