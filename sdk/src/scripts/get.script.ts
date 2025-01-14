import { log } from 'console';

import { DCAMainnet } from './utils.script';

(async () => {
  try {
    const dcaObject = await DCAMainnet.get(
      '0x3a1f99d3358bc86c8c57f769a3bbcffd1305c17df9c3c86b0b79b3607c9e50f7'
    );

    log({ dcaObject });
  } catch (e) {
    console.log(e);
  }
})();
