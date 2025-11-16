export type ExplorerUrlType = "tx" | "name" | "address" | "block";

export type Explorer = {
  id: string;
  label: string;
  tx: string;
  name: string;
  address: string;
  block: string;
};

export const EXPLORERS: Explorer[] = [
  {
    id: 'hns-dev',
    label: 'hns.dev',
    tx: 'https://explorer.hns.dev/tx/%s',
    name: 'https://explorer.hns.dev/name/%s',
    address: 'https://explorer.hns.dev/address/%s',
    block: 'https://explorer.hns.dev/block/%s',
  },
  {
    id: 'shakeshift',
    label: 'ShakeShift',
    tx: 'https://shakeshift.com/transaction/%s',
    name: 'https://shakeshift.com/name/%s',
    address: 'https://shakeshift.com/address/%s',
    block: 'https://shakeshift.com/block/%s',
  },
  {
    id: 'hns-fans',
    label: 'HNS Fans',
    tx: 'https://e.hnsfans.com/tx/%s',
    name: 'https://e.hnsfans.com/name/%s',
    address: 'https://e.hnsfans.com/address/%s',
    block: 'https://e.hnsfans.com/block/%s',
  },
];

/**
 * Get the explorer URL for a given type and value
 */
export function getExplorerUrl(
  explorer: Explorer,
  type: ExplorerUrlType,
  value: string
): string {
  const template = explorer[type];

  if (!template) {
    throw new Error(`Explorer ${explorer.label} does not support ${type} URLs`);
  }

  return template.replace("%s", value);
}
