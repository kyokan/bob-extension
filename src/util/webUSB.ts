export const isSupported = (): Promise<boolean> =>
  Promise.resolve(
    !!navigator &&
      !!navigator.usb &&
      typeof navigator.usb.getDevices === "function"
  );
