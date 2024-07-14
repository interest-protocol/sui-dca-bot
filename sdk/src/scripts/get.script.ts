import { DCATestnet } from './utils.script';

import { log } from 'console';

(async () => {
  try {
    const dcaObject = await DCATestnet.get(
      '0xbe76eebdea3f22b8f04fd72fcebd2d986df5aaac858c5882967097b0162f9ed2'
    );

    log({ dcaObject });
  } catch (e) {
    console.log(e);
  }
})();
