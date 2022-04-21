export type LRUTLLCacheOption<cacheValueType> = {
  ttl?: number;
  size?: number;
  onDelete?: (value: cacheValueType) => void;
}

export class LRUTTLCache<cacheValueType> {
  ttl: number;
  size: number;
  totalSize: number;
  onDelete?: (value: cacheValueType) => void;

  cache: {
    [key: string]: {
      value: cacheValueType;
      expiry: number;
    };
  };

  timeouts: {
    [key: string]: any;
  };

  constructor(opts?: LRUTLLCacheOption<cacheValueType>) {
    this.ttl = opts?.ttl || 15 * 60 * 1000;
    this.size = opts?.size || 25000000;
    this.totalSize = 0;
    this.cache = {};
    this.timeouts = {};
    this.onDelete = opts?.onDelete;
  }

  ensureSize = (newSize: number) => {
    if (this.totalSize + newSize > this.size) {
      const keys = Object.keys(this.cache);
      let earliestTTLKey = keys[0];

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const cached = this.cache[key];
        const earliest = this.cache[earliestTTLKey];

        if (cached.expiry < earliest.expiry) {
          earliestTTLKey = key;
        }
      }

      this.del(earliestTTLKey);
      this.ensureSize(newSize);
    }
  };

  del(key: string) {
    const cached = this.cache[key];

    if (cached) {
      delete this.cache[key];

      if (typeof cached.value === 'string') {
        this.totalSize = this.totalSize - cached.value.length;
      }

      if (this.onDelete) {
        this.onDelete(cached.value);
      }
    }
  }

  set(key: string, value: cacheValueType) {
    this.cache[key] = {
      value: value,
      expiry: Date.now() + this.ttl,
    };

    if (typeof value === 'string') {
      this.ensureSize(value.length);
      this.totalSize = this.totalSize + value.length;
    }

    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
    }

    this.timeouts[key] = setTimeout(() => this.del(key), this.ttl);
  }

  get(key: string) {
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
    }

    this.timeouts[key] = setTimeout(() => this.del(key), this.ttl);

    return this.cache[key]?.value;
  }
}

export const torrentFileCache = new LRUTTLCache<string>();
export const torrentURICache = new LRUTTLCache<string>();
export const torrentFileStatus = new LRUTTLCache<boolean>();
export const torrentCache = new LRUTTLCache<any>();
