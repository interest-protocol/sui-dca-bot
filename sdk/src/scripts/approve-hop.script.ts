import { executeTx, log } from './utils.script';
import { HOP_TESTNET_WITNESS, OBJECT_IDS } from './constants.script';
import { Transaction } from '@mysten/sui/transactions';

(async () => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${OBJECT_IDS.testnet.dca}::trade_policy::approve`,
      typeArguments: [HOP_TESTNET_WITNESS],
      arguments: [
        tx.object(OBJECT_IDS.testnet.adminCap),
        tx.object(OBJECT_IDS.testnet.tradePolicy),
      ],
    });

    const result = await executeTx(tx);

    log(result);
  } catch (e) {
    console.log(e);
  }
})();
