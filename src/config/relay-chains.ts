
import {
  Currency,
  BitcoinUnit,
  KBtc, // on Kusama
  Kusama, // on Kusama
  KBtcAmount, // on Kusama
  InterBtc, // on Polkadot
  Polkadot, // on Polkadot
  InterBtcAmount // on Polkadot
} from '@interlay/monetary-js';
import { CollateralUnit } from '@interlay/interbtc-api';

import {
  POLKADOT,
  KUSAMA
} from 'utils/constants/relay-chain-names';

if (!process.env.REACT_APP_RELAY_CHAIN_NAME) {
  throw new Error('Undefined relay chain name environment variable!');
}

let APP_NAME: string;
let WRAPPED_TOKEN: Currency<BitcoinUnit>;
let COLLATERAL_TOKEN: Currency<CollateralUnit>;
let PRICES_URL: string;

type WrappedTokenAmount =
  InterBtcAmount |
  KBtcAmount;

switch (process.env.REACT_APP_RELAY_CHAIN_NAME) {
case POLKADOT: {
  APP_NAME = 'interBTC';
  WRAPPED_TOKEN = InterBtc;
  COLLATERAL_TOKEN = Polkadot as Currency<CollateralUnit>;
  PRICES_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,polkadot&vs_currencies=usd';
  break;
}
case KUSAMA: {
  APP_NAME = 'kBTC';
  WRAPPED_TOKEN = KBtc;
  COLLATERAL_TOKEN = Kusama as Currency<CollateralUnit>;
  PRICES_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,kusama&vs_currencies=usd';
  break;
}
default: {
  throw new Error('Invalid relay chain name!');
}
}

export type {
  WrappedTokenAmount
};

export {
  APP_NAME,
  WRAPPED_TOKEN,
  COLLATERAL_TOKEN,
  PRICES_URL
};
