import {GenericService} from "@src/util/svc";

export default class SettingService extends GenericService {
  getAPI = async () => {
    return {
      // apiHost: 'https://5pi.io/hsd',
      // apiKey: '028b0965978137223fb9d132de96993c',
      //
      apiHost: 'http://localhost:3000/hsd',
      apiKey: '028b0965978137223fb9d132de96993c',

      // apiHost: 'http://localhost:12037',
      // apiKey: '5caadfadcad9e3bc79164ac14bb55ace1035d61e',
    };
  };

  async start() {

  }

  async stop() {

  }
}
