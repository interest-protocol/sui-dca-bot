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
    dca: '0x29d181f4154973ccd5e392ccce3b2ed44d7644ba7e1a2479239bea26c615d9ac',
    adapters:
      '0xa4c68051bf638dbb2e0e0f6532680a5f4c0cb31a21fb1fbe50f3336c9110ea11',
    adminCap:
      '0xf933a1b16fac37bba263ed30872f51a39513bbc04bf125bd882414004a33834c',
    tradePolicy:
      '0x7574069b7fa1a87114433ed3cbcc29fa64fb47e0b0f63ad142484b5cd1babc89',
  },
  mainnet: {
    dca: '0x0',
    adapters: '0x0',
    adminCap: '0x0',
    tradePolicy: '0x0',
  },
};

export const HOP_TESTNET_WITNESS = `${OBJECT_IDS.testnet.adapters}::hop_adapter::Hop`;
