import {Database, SqlValue} from "sql.js";
import {getTXAction, getTXNameHash} from "@src/util/transaction";
const rules = require('hsd/lib/covenants/rules');
const {typesByVal} = rules;

export type Transaction = {
  hash: string;
  witnessHash: string;
  fee: number;
  rate: number;
  mtime: number;
  time: number;
  index: number;
  version: number;
  locktime: number;
  hex: string;
  blockHeight: number;
  inputs: any[];
  outputs: any[];
}

export async function ensureTransactionsTable(db: Database) {
  const sql = `
    CREATE TABLE transactions (
      hash VARCHAR PRIMARY KEY,
      fee BIGINT,
      rate BIGINT,
      mtime BIGINT,
      time BIGINT,
      block_height BIGINT,
      action VARCHAR,
      name_hash VARCHAR
    );
  `;

  try {
    await db.exec(sql);
  } catch (e) {
    if (!(/already exists/g).test(e.message)) {
      throw e;
    }
  }
}



export async function ensureOutputsTable(db: Database) {
  const createSQL = `
    CREATE TABLE outputs (
      id SERIAL PRIMARY KEY,
      tx_hash varchar,
      output_index int,
      value bigint,
      address varchar,
      covenant_type int,
      covenant_action varchar,
      covenant_items varchar[],
      CONSTRAINT tx_outputs
        FOREIGN KEY(tx_hash)
          REFERENCES transactions(hash)
    );
  `;

  const createIndexSQL = `
    CREATE INDEX idx_outputs_address
    ON outputs(address);
  `;

  const createTxHashIndexSQL = `
    CREATE INDEX idx_outputs_tx_hash_index
    ON outputs(tx_hash, output_index);
  `;

  try {
    await db.exec(createSQL);
    await db.exec(createIndexSQL);
    await db.exec(createTxHashIndexSQL);
  } catch (e) {
    if (!(/already exists/g).test(e.message)) {
      throw e;
    }
  }
}

export async function ensureInputsTable(db: Database) {
  const createSQL = `
    CREATE TABLE inputs (
      id SERIAL PRIMARY KEY,
      tx_hash varchar,
      input_index int,
      prev_output_hash varchar,
      prev_output_index bigint,
      witness varchar[],
      sequence bigint,
      address varchar,
      CONSTRAINT tx_inputs
        FOREIGN KEY(tx_hash)
          REFERENCES transactions(hash)
    );
  `;

  const createIndexSQL = `
    CREATE INDEX idx_inputs_address ON inputs(address);
  `;

  const createTxHashIndexSQL = `
    CREATE INDEX idx_inputs_tx_hash_index ON inputs(tx_hash, input_index);
  `;

  const createPrevOutSQL = `
    CREATE INDEX idx_inputs_prev_out_hash_index ON inputs(prev_output_hash, prev_output_index);
  `;

  try {
    await db.exec(createSQL);
    await db.exec(createIndexSQL);
    await db.exec(createTxHashIndexSQL);
    await db.exec(createPrevOutSQL);
  } catch (e) {
    if (!(/already exists/g).test(e.message)) {
      throw e;
    }
  }
}

export async function insertTransaction(db: Database, txData: any) {
  try {
    const [res] = await db.exec(
      'SELECT * FROM transactions WHERE hash = @hash',
      {
        "@hash": txData.hash,
      },
    );

    const exists = !!res;

    if (!exists) {
      const action = getTXAction(txData);
      const nameHash = getTXNameHash(txData);

      await db.exec(`
          INSERT INTO transactions (
            hash,
            fee,
            rate,
            mtime,
            time,
            block_height,
            action,
            name_hash
          )
          VALUES (
            :hash,
            :fee,
            :rate,
            :mtime,
            :time,
            :blockHeight,
            :action,
            :nameHash
          )
        `, {
        ":hash": txData.hash,
        ":fee": txData.fee,
        ":rate": txData.rate,
        ":mtime": txData.mtime,
        ":time": txData.time,
        ":blockHeight": txData.height,
        ":action": action,
        ":nameHash": nameHash || null,
      });
    }

    // for (let inputIndex = 0; inputIndex < txData.inputs.length; inputIndex++) {
    //   const input = txData.inputs[inputIndex];
    //   await insertInputData(db, {
    //     ...input,
    //     txHash: txData.hash,
    //     index: inputIndex,
    //   });
    // }
    //
    // for (let outputIndex = 0; outputIndex < txData.outputs.length; outputIndex++) {
    //   const output = txData.outputs[outputIndex];
    //   await insertOutputData(db, {
    //     ...output,
    //     blockHeight: txData.blockHeight,
    //     txHash: txData.hash,
    //     index: outputIndex,
    //   });
    // }
  } catch (e) {
    throw e;
  }
}

export async function insertInputData(db: Database, inputData: any) {
  try {
    const [res] = await db.exec(
      'SELECT * FROM inputs WHERE tx_hash = :txHash AND input_index = :inputIndex',
      {
        ':txHash': inputData.txHash,
        ':inputIndex': inputData.index,
      },
    );
    const exists = !!res;

    if (!exists) {
      await db.exec(`
          INSERT INTO inputs (
            tx_hash,
            input_index,
            prev_output_hash,
            prev_output_index,
            witness,
            sequence,
            address
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, {
        "$1": hexify(inputData.txHash) as SqlValue,
        "$2": inputData.index,
        "$3": hexify(inputData.prevout?.hash) as SqlValue,
        "$4": inputData.prevout?.index,
        "$5": hexify(inputData.witness) as SqlValue,
        "$6": inputData.sequence,
        "$7": inputData.coin ? inputData.coin.address : inputData.address,
      });
    }
  } catch (e) {
    throw e;
  }
}
//

export async function insertOutputData(db: Database, outputData: any) {
  try {
    const [res] = await db.exec(
      'SELECT * FROM outputs WHERE tx_hash = $1 AND output_index = $2',
      {
        "$1": outputData.txHash,
        "$2": outputData.index,
      },
    );
    const exists = !!res;

    if (!exists) {
      await db.exec(`
          INSERT INTO outputs (
            tx_hash,
            output_index,
            value,
            address,
            covenant_type,
            covenant_action,
            covenant_items
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, {
        "$1": hexify(outputData.txHash) as SqlValue,
        "$2": outputData.index,
        "$3": outputData.value,
        "$4": outputData.address,
        "$5": outputData.covenant?.type || null,
        "$6": typesByVal[outputData.covenant?.type] || null,
        "$7": hexify(outputData.covenant?.items) as SqlValue || null,
      });
    }
  } catch (e) {
    throw e;
  }
}

function hexify(data: string|Buffer|Uint8Array|string[]|Buffer[]|Uint8Array[]): string|string[]|undefined {
  if (typeof data === 'string') return data;
  if (Buffer.isBuffer(data)) return data.toString('hex');
  if (data instanceof Uint8Array) return Array.prototype.map.call(data, x => ('00' + x.toString(16)).slice(-2)).join('');

  if (Array.isArray(data)) {
    return data.map((d: string|Buffer|Uint8Array) => {
      if (typeof d === 'string') return d;
      if (Buffer.isBuffer(d)) return d.toString('hex');
      if (d instanceof Uint8Array) return Array.prototype.map.call(d, x => ('00' + x.toString(16)).slice(-2)).join('');
      return '';
    });
  }

  return undefined;
}
