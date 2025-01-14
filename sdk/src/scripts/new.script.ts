import { Transaction } from '@mysten/sui/transactions';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { TimeScale } from 'src/dca';

import { WITNESSES } from '../dca/constants';
import { DCAMainnet, executeTx, keypair, log } from './utils.script.ts';

(async () => {
  try {
    const initTx = new Transaction();

    const sui = initTx.splitCoins(initTx.gas, [1_000_000_000n]);

    const USDCType =
      '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

    const tx = DCAMainnet.newAndShareWithRecipient({
      tx: initTx,
      coinInType: SUI_TYPE_ARG,
      coinOutType: USDCType,
      coinIn: sui,
      timeScale: TimeScale.Hour,
      every: 1,
      numberOfOrders: 3,
      delegatee: keypair.getPublicKey().toSuiAddress(),
      witnessType: WITNESSES.WHITELIST_ADAPTER,
      recipient:
        '0xb0aa870a5dc5f318430a17b3fd26f7bd83b72ce08d86b8e52eba796681e46768',
    });

    const result = await executeTx(tx);

    log(result);
  } catch (e) {
    console.log(e);
  }
})();
