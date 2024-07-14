import { DCATestnet } from './utils.script';

import { log } from 'console';

(async () => {
  try {
    const dcaObject = await DCATestnet.get(
      '0xa4176bea17737ebb71790c8232cbb0c5745ba769f1856683311d70fca569178e'
    );

    log({ dcaObject });
  } catch (e) {
    console.log(e);
  }
})();
