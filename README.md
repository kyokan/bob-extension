# Bob Extension

Handshake wallet in the browser

![home](https://user-images.githubusercontent.com/8507735/115999984-2f7e7100-a5a3-11eb-98f3-9a82329c11c2.png)

### Note about wallet rescan

Bob extension uses the address indexer to make wallet rescan faster and more performant on our hosted infrastructure. However, this will expose all addresses related to your wallet to our backend. We do not keep any logs containing your addresses. If privacy is a concern, you may point RPC to a different `hsd` node (including Bob Desktop!) in settings prior to importing your wallet.

## Development

**Install**
```
npm install 
```

**Run in dev mode**
```
NODE_ENV=development npm run dev
```

**Run in simnet**
```
NETWORK_TYPE=simnet npm run dev
```

**Build**
```
NODE_ENV=production npm run build
```

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
const tx = await wallet.sendBid('silverhand');
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
