import {EventEmitter} from "events";

export interface Service {
  start(): Promise<void>;
  stop(): Promise<void>;
  exec(serviceName: string, method: string, params: {[k: string]: any}): Promise<any>;
}

export type ServiceMessage = {
  service: string;
  method: string;
  params: any[];
  nonce: number;
}

export class GenericService extends EventEmitter implements Service {
  nonce: number;
  private _serviceName: string;
  private _services: {
    [serviceName: string]: GenericService;
  };

  constructor() {
    super();
    this.nonce = 0;
    this._services = {};
    this._serviceName = '';
  }

  setServiceName (serviceName: string, services: {[serviceName: string]: GenericService}) {
    this._serviceName = serviceName;
    this._services = services;
  }

  emit (eventName: string, ...args: any[]): boolean {
    console.log('emit event', {
      service: this._serviceName,
      eventName,
    });

    return super.emit(eventName, ...args);
  }

  listen(serviceName: string, eventName: string, cb: (...arg: any[]) => void): () => void {
    const svc = this._services[serviceName];

    if (!svc) {
      throw new Error(`cannot found service ${serviceName}`);
    }

    const wrappedCallback = async (...args: any[]) => {
      try {
        await cb.apply(this, args);
        console.log('handled event', {
          service: this._serviceName,
          from: serviceName,
          eventName,
        });
      } catch (e) {
        console.error(e);
      }
    };

    svc.addListener(eventName, wrappedCallback);

    return () => {
      this.removeListener(eventName, wrappedCallback);
    }
  }

  async exec<returnType = any>(service: string, method: string, ...params: any[]): Promise<returnType> {
    const nonce = this.nonce++;
    return new Promise((resolve, reject) => {
      this.once(`response-${nonce}`, ([err, resp]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(resp);
      });

      this.emit('execute', {
        service,
        method,
        params,
        nonce,
      });
    });
  }

  async start() {}

  async stop() {}
}


export class AppService extends GenericService {
  services: {
    [serviceName: string]: GenericService
  };

  constructor() {
    super();
    this.services = {};
    this.on('execute', (msg) => this.handleExecute(msg, this));
    this.setServiceName('app', this.services);
  }

  private async handleExecute (msg: ServiceMessage, origin: GenericService) {
    const target = this.services[msg.service] || {};

    // @ts-ignore
    const method = target[msg.method];
    try {
      const resp = await method.apply(target, msg.params);
      origin.emit(`response-${msg.nonce}`, [null, resp]);
    } catch (err) {
      origin.emit(`response-${msg.nonce}`, [
        err,
        null,
      ]);
    }
  };

  add(serviceName: string, service: GenericService): AppService {
    this.services[serviceName] = service;
    service.setServiceName(serviceName, this.services);
    service.on('execute', (msg) => this.handleExecute(msg, service));
    return this;
  }

  async start() {
    for (const serviceName in this.services) {
      try {
        await this.services[serviceName]!.start();
        console.log(`${serviceName} initialized`,{ service: serviceName });
      } catch (e) {
        console.error(e, { service: serviceName })
      }
    }
    console.log('app initialized');
  }

  async stop() {
    for (const serviceName in this.services) {
      await this.services[serviceName]!.stop();
    }
  }
}

