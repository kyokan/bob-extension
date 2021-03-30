export type ReduxAction = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export default async function pushMessage(message: ReduxAction) {
  const res = await chrome.runtime.sendMessage(message);
  return res;
}
