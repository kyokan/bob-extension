# Bob Extension

Handshake wallet in the browser 

[Chrome Web Store](https://chrome.google.com/webstore/detail/bob-extension/ogcmjchbmdichlfelhmceldndgmgpcem)

![home](https://user-images.githubusercontent.com/8507735/115999984-2f7e7100-a5a3-11eb-98f3-9a82329c11c2.png)

### Note about wallet rescan

Bob extension uses the address indexer to make wallet rescan faster and more performant on our hosted infrastructure. However, this will expose all addresses related to your wallet to our backend. We do not keep any logs containing your addresses. If privacy is a concern, you may point RPC to a different `hsd` node (including Bob Desktop!) in settings prior to importing your wallet.

## Development

**Requirement**
- Node v12+

**Install**
```
npm install
```

**Build for development**
```
npm run build:dev
```

**Build for production**
```
npm run build
```

**Build with simnet**
```
NETWORK_TYPE=simnet npm run build:dev
```

**Note**: The extension now uses Manifest V3 and runs as a service worker. After building, load the extension from the `dist/` directory in Chrome via `chrome://extensions` (enable Developer Mode).

## Omnibox Navigation

Navigate to Handshake names using Chrome's omnibox feature:

1. Type `bob` in Chrome's address bar
2. Press `Tab` or `Space`
3. Enter a Handshake name (e.g., `welcome`, `proofofconcept`, `nb`)
4. Press `Enter`

The extension will:
- Check if the name has a magnet/torrent record (Federalist site) and load the P2P content viewer
- Otherwise, navigate to `http://<handshake-name>/`

**Note**: For regular HTTP navigation to work, you need a local Handshake resolver (like [hdns](https://github.com/handshake-org/hdns) or [hnsd](https://github.com/handshake-org/hnsd)) or use a DNS provider that supports Handshake names.

### Federalist Support

Bob Extension supports [Federalist](https://github.com/kyokan/federalist) - a decentralized web hosting platform using BitTorrent. Handshake names with magnet links in their TXT records will automatically load through the P2P torrent viewer.

### Injected Bob3 

Bob Extension injects a Bob3 object to each page, which enables apps to interact with the wallet. 

**Connect to Bob extension and get wallet info**
```js
// If Bob is locked, this will open the popup and prompt user to login
const wallet = await bob3.connect();
const receiveAddress = await wallet.getAddress();
const balance = await wallet.getBalance();
```

**Send Open**

Once a name is available, a sendopen transaction starts the opening phase.

```js
// Bob3 uses the same
const wallet = await bob3.connect();
const tx = await wallet.sendOpen('silverhand');
```

**Send Bid**

Place a bid

Params:

| Name  | Default | Description |
| ------------- | ------------- |-------------|
| name  | Required  | name to bid on |
| amount  | Required  | amount to bid (in HNS) |
| lockup  | Required  | amount to lock up to blind your bid (must be greater than bid amount) |

```js
// Bob3 uses the same
const wallet = await bob3.connect();
const tx = await wallet.sendBid('silverhand', 100, 150);
```

**Send Reveal**

Reveal a bid

Params:

| Name  | Default | Description |
| ------------- | ------------- |-------------|
| name  | Required  | name to reveal bid for |

```js
// Bob3 uses the same
const wallet = await bob3.connect();
const tx = await wallet.sendReveal('silverhand');
```

**Send Redeem**

Redeem a losing bid after REVEAL period is over.

Params:

| Name  | Default | Description |
| ------------- | ------------- |-------------|
| name  | Required  | name to redeem bid for |

```js
// Bob3 uses the same
const wallet = await bob3.connect();
const tx = await wallet.sendRedeem('silverhand');
```

**Send Update**

Update root zone record. First update is called a register, which will return the difference between winning bid and second highest bid. 

Params:

| Name  | Default | Description |
| ------------- | ------------- |-------------|
| name  | Required  | name to update data for |
| data  | Required  | [JSON-encoded resource](https://hsd-dev.org/api-docs/#resource-object) |

```js
// Bob3 uses the same
const wallet = await bob3.connect();
const tx = await wallet.sendUpdate('silverhand', [ 
  {
    type: "NS", 
    ns: "ns1.example.com.",
  },
]);
```
