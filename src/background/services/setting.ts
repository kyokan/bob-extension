import {GenericService} from "@src/util/svc";

export default class SettingService extends GenericService {
  async start() {
    this.emit('test');
  }

  async stop() {

  }
}
