import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';

import { COINS } from './coins.script';
import { DCAMainnet, executeTx, log } from './utils.script';

(async () => {
  try {
    const initTx = new Transaction();

    const {
      tx: tx1,
      request,
      coinIn,
    } = DCAMainnet.swapWhitelistStart({
      tx: initTx,
      coinInType: COINS.usdc.coinType,
      coinOutType: COINS.eth.coinType,
      dca: '0x818a58304a87878395f2a1ac41bbcac8d30b436b03823bd471af80ac449923b0',
    });

    tx1.transferObjects([coinIn], normalizeSuiAddress('0x0'));

    // hop logic here
    const coinETH = initTx.moveCall({
      target: '0x2::coin::mint',
      typeArguments: [COINS.eth.coinType],
      arguments: [initTx.object(COINS.eth.treasuryCap), initTx.pure.u64(100n)],
    });

    const tx2 = DCAMainnet.swapWhitelistEnd({
      tx: tx1,
      coinInType: COINS.usdc.coinType,
      coinOutType: COINS.eth.coinType,
      dca: '0x818a58304a87878395f2a1ac41bbcac8d30b436b03823bd471af80ac449923b0',
      request,
      coinOut: coinETH,
    });

    const result = await executeTx(tx2);

    log(result);
  } catch (e) {
    console.log(e);
  }
})();
