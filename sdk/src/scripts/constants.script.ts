export const COINS = {
  usdt: {
    treasuryCap:
      '0x99ee533652462c5f990c193bf502c16429af600d51b7bf774d1e3cf76623cab6',
    coinType:
      '0xcd79b4f3d61afacdd30632ccdfc05f923b9847d21ba19c7bae9c73e5d860f5b5::usdt::USDT',
  },
  usdc: {
    treasuryCap:
      '0x59ba3c06c55a80e64551a0f9289d5fee9522778f4d81d5871d15f6d0a7686a87',
    coinType:
      '0xcd79b4f3d61afacdd30632ccdfc05f923b9847d21ba19c7bae9c73e5d860f5b5::usdc::USDC',
  },
  eth: {
    treasuryCap:
      '0xc3cea680608424c2d4f618577d2991c7a99bd29a98f58e0be75555858e9c54af',
    coinType:
      '0xcd79b4f3d61afacdd30632ccdfc05f923b9847d21ba19c7bae9c73e5d860f5b5::eth::ETH',
  },
  btc: {
    treasuryCap:
      '0xea65017ca55ad4b46f51c2e0ce9df86a3bcccba33ccbfa51aade38c2c92fa963',
    coinType:
      '0xcd79b4f3d61afacdd30632ccdfc05f923b9847d21ba19c7bae9c73e5d860f5b5::btc::BTC',
  },
};

export const OBJECT_IDS = {
  testnet: {
    dca: '0xbc9ef96a26b7352270a6ee77707aa649df57707fccfe0f71a716ec14c80174d9',
    adapters:
      '0x902d25ea000254beaa4b819fa33e2fc8228fae56820bf4f8795f78fa7ffddc7c',
    adminCap:
      '0x64a9e5e99891f72a4fef7196ea5ee9db2b452d59a7236eaecc3aeb02282c4e52',
    tradePolicy:
      '0xaba8b3b21fdce1e9285a733b7be4ab40a6e31a5850999ad2ae4f2eebd3904201',
  },
  mainnet: {
    dca: '0x0',
    adapters: '0x0',
    adminCap: '0x0',
    tradePolicy: '0x0',
  },
};

export const HOP_TESTNET_WITNESS = `${OBJECT_IDS.testnet.adapters}::hop_adapter::Hop`;
