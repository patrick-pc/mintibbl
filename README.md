# 🎨 <span>mintibbl</span>

Draw, guess, and mint with your frens!

## Getting Started

Project structure:
- client (front-end)
- hardhat (smart contract)
- server (<span>socket.io</span>)

### Requirements
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

## Usage

```bash
git clone https://github.com/web3slinger/mintibbl
```

Setup environment variables. See .env.example

### client

```bash
cd client
yarn dev
```

### server

```bash
cd server
yarn dev
```

### hardhat

```bash
cd hardhat
hh deploy
```

Testing:

```bash
hh test
```

### Deploying on mainnet or a testnet

1. Setup environment variables
2. Get MATIC or testnet MATIC
3. Deploy

```bash
hh deploy --network polygon
```

## Thank you!

If you appreciated this, feel free to follow me or tip me!

- [twitter.com/web3slinger](https://twitter.com/web3slinger)
- [cryptip.me/web3slinger.eth](https://cryptip.me/web3slinger.eth)