import { normalizeStructTag } from '@mysten/sui/utils';
import { PACKAGES } from 'src/dca';

import { client, log } from './utils.script';

(async () => {
  try {
    const x = await client.getCoinMetadata({
      coinType:
        '0x43e9045850072b10168c565ca7c57060a420015343023a49e87e6e47d3a74231::hoppy::HOPPY',
    });

    log(x);
  } catch (e) {
    console.log(e);
  }
})();
