import { DCATestnet } from './utils.script';
import { COINS } from './constants.script';

import invariant from 'tiny-invariant';

(async () => {
  try {
    const isActive = await DCATestnet.isActive({
      dca: '0xa4176bea17737ebb71790c8232cbb0c5745ba769f1856683311d70fca569178e',
      coinInType: COINS.usdc.coinType,
      coinOutType: COINS.eth.coinType,
    });

    invariant(typeof isActive === 'boolean', 'Error is not active');
    invariant(isActive, 'Error is not active');
  } catch (e) {
    console.log(e);
  }
})();
