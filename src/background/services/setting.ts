import {GenericService} from "@src/util/svc";

export default class SettingService extends GenericService {
  getAPI = async () => {
    return {
      // apiHost: 'https://5pi.io/hsd',
      // apiKey: '028b0965978137223fb9d132de96993c',
      apiHost: 'http://localhost:12037',
      apiKey: 'ac7f973be57d6ef32c5b88cdcb474b1c414e3a6d',
    };
  };

  async start() {

  }

  async stop() {

  }
}
