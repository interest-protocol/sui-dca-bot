import { Transaction } from '@mysten/sui/transactions';

import { OWNED_OBJECTS, PACKAGES, SHARED_OBJECTS } from '../dca/constants';
import { executeTx, log } from './utils.script';

(async () => {
  try {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGES.ADAPTERS_V2}::whitelist_adapter::add`,
      arguments: [
        tx.object(SHARED_OBJECTS.WHITELIST_MUT),
        tx.object(OWNED_OBJECTS.DCA_ADMIN),
        tx.pure.address(
          '0xae67a84ffd814ac5005e2de892be9acb2372712b7ec9605360620e964deb09a4'
        ),
      ],
    });

    const result = await executeTx(tx);

    log(result);
  } catch (e) {
    console.log(e);
  }
})();
