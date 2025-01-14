import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { DCAMainnet, executeTx, log } from './utils.script';

const USDCType =
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

(async () => {
  try {
    const tx = DCAMainnet.stopAndDestroy({
      dca: '0x05d92e3a1f304afff9c14bb7aae17678a02e8f586bcb9aa676305d50a54964d4',
      coinInType: SUI_TYPE_ARG,
      coinOutType: USDCType,
    });

    const result = await executeTx(tx);

    log(result);
  } catch (e) {
    console.log(e);
  }
})();
