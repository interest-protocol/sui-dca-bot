import { Transaction } from '@mysten/sui/transactions';

import { executeTx, keypair, log, DCATestnet } from './utils.script';
import { COINS } from './constants.script';
import { TimeScale } from 'src/dca';

(async () => {
  try {
    const initTx = new Transaction();

    // USDC has 6 decimals
    const coinUSDC = initTx.moveCall({
      target: '0x2::coin::mint',
      typeArguments: [COINS.usdc.coinType],
      arguments: [
        initTx.object(COINS.usdc.treasuryCap),
        initTx.pure.u64(1_000n),
      ],
    });

    const tx = DCATestnet.newAndShare({
      tx: initTx,
      coinInType: COINS.usdc.coinType,
      coinOutType: COINS.eth.coinType,
      coinIn: coinUSDC,
      timeScale: TimeScale.Seconds,
      every: 30,
      numberOfOrders: 1000,
      delegatee: keypair.getPublicKey().toSuiAddress(),
    });

    const result = await executeTx(tx);

    log(result);
  } catch (e) {
    console.log(e);
  }
})();
