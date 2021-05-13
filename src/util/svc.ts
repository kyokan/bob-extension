import {EventEmitter2} from "eventemitter2";

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

export class GenericService extends EventEmitter2 implements Service {
  nonce: number;
  private _serviceName: string;
  private _services: {
    [serviceName: string]: GenericService;
  };

  constructor() {
    super({ wildcard: true, delimiter: '.' });
    this.nonce = 0;
    this._services = {};
    this._serviceName = '';
  }

  setServiceName (serviceName: string, services: {[serviceName: string]: GenericService}) {
    this._serviceName = serviceName;
    this._services = services;
  }

  async exec<returnType = any>(serviceName: string, methodName: string, ...params: any[]): Promise<returnType> {
    return new Promise(async (resolve, reject) => {
      const service = this._services[serviceName];
      // @ts-ignore
      const method = service[methodName];

      try {
        console.log({ serviceName, methodName, params });
        const response = await method.apply(service, params);
        console.log({ serviceName, methodName, response });
        resolve(response);
      } catch (e) {
        console.error(e, { serviceName, methodName });
        reject(e);
      }
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
    this.setServiceName('app', this.services);
  }

  add(serviceName: string, service: GenericService): AppService {
    const that = this;
    this.services[serviceName] = service;
    service.setServiceName(serviceName, this.services);
    service.on('*', function (...args) {
      // @ts-ignore
      that.emit([serviceName, this.event], ...args);
    });
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

