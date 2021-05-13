import {GenericService} from "@src/util/svc";
const bdb = require('bdb');
const DB = require('bdb/lib/DB');
import {get, put} from '@src/util/db';
import initSqlJs, {Database, SqlJsStatic} from "sql.js";
import {
  ensureTransactionsTable,
  insertTransaction
} from "@src/background/services/db/transactions";

export default class DatabaseService extends GenericService {
  SQL?: SqlJsStatic;
  db?: Database;
  store?: typeof DB;

  setDB = async (wid: string) => {
    if (!this.SQL) throw new Error('SQL not initialized');
    if (!wid) {
      this.db = undefined;
      return;
    }

    this.db = new this.SQL.Database(await this.readDBAsBuffer(wid));
    await ensureTransactionsTable(this.db);
    this.saveDBAsBuffer(wid);
  };

  async readDBAsBuffer(wid: string): Promise<Buffer> {
    if (!wid) throw new Error('wallet not selected');
    const buf = await get(this.store, `SQL_DB_${wid}`);
    // return Buffer.alloc(0);
    if (!buf) return Buffer.alloc(0);
    return Buffer.from(buf, 'hex');
  }

  async saveDBAsBuffer(wid: string) {
    if (!this.db) throw new Error('db is not initialized');
    const buf = await this.db.export();
    const hex = Array.prototype.map.call(buf, x => ('00' + x.toString(16)).slice(-2)).join('');
    await put(this.store, `SQL_DB_${wid}`, hex);
  }

  async queryTransactions(limit = 20, offset = 0) {
    if (!this.db) throw new Error('db is not initialized');

    const [res] = await this.db.exec(`
      SELECT * FROM transactions
      ORDER BY transactions.block_height DESC
      LIMIT :limit OFFSET :offset;
    `, {
      ':limit': limit,
      ':offset': offset,
    });

    if (res) {
      return res.values.map(([hash, fee, rate, mtime, time, blockHeight, action, nameHash]) => {
        return {
          hash,
          fee,
          rate,
          mtime,
          time,
          blockHeight,
          action,
          nameHash,
        };
      })
    }

    return [];
  }

  insertTX = async (transaction: any) => {
    if (!this.db) throw new Error('db is not initialized');
    await insertTransaction(this.db, transaction);
  };

  async start () {
    this.SQL = await initSqlJs({
      locateFile: file => `/wasm/sql-wasm.wasm`,
    });
    this.store = bdb.create('/db-store');
    await this.store.open();
  }
}
