import { Inputs } from '@mysten/sui/transactions';

import { Package, SharedObjects } from './dca.types';

export const PACKAGES: Package = {
  DCA: '0x33d51e66410b5d98fdd013d16194ab35b43d5b8fc76523876cd5f971c52084dd',
  ADAPTERS:
    '0x8ff90cb0c620d9e62eefbf1da08d62d229d0282de8858424314e230ecda5e6bc',
  DCA_V2: '0x2f2ac80533574e9c5c8df26ed407d8dde3bc9233cab633433a971d46a4d7fbd2',
  ADAPTERS_V2:
    '0x3223cf2259ad386fce4ec9dcb5df862ad338a6d00578abf3bbc0172d9850c590',
  DCA_V3: '0x6a468317bc530d376e8e87347ba8a724384dd4512062f7b7fffda5c65c1e8f5e',
  DCA_V4: '0x84fbfcb11c2eb86f719f8c87c678ee72e56dbd6e1880b3b69bb2bcdeb95d80a1',
  DCA_V5: '0x56faccfed3b80fbecde37e4a323f1d9cb03c8589c81c1322b8704180b6748370',
} as const;

export const OWNED_OBJECTS = {
  ADAPTER_UPGRADE_CAP:
    '0x6cba08aeacf0f6ed79dd42d0b979164e6d74f7a948efe86c649da5a74f58284f',
  DCA_UPGRADE_CAP:
    '0xae0a4a3d9376a037c7c17aa6cad9e8ef493c1346704319aab8610614aa229fff',
  DCA_ADMIN:
    '0xd46d636ff76434b4ab51a346ed7cf5572534de2faf572c41057c99d1b6e03302',
} as const;

export const SHARED_OBJECTS: SharedObjects = {
  TRADE_POLICY_MUT: Inputs.SharedObjectRef({
    objectId:
      '0x3bf87821085b4bf6a0574dcee1de533c4296bf1b624dab1984f3a92df4ea28fd',
    initialSharedVersion: '330857975',
    mutable: true,
  }) as ReturnType<typeof Inputs.SharedObjectRef>,
  TRADE_POLICY: Inputs.SharedObjectRef({
    objectId:
      '0x3bf87821085b4bf6a0574dcee1de533c4296bf1b624dab1984f3a92df4ea28fd',
    initialSharedVersion: '330857975',
    mutable: false,
  }) as ReturnType<typeof Inputs.SharedObjectRef>,
  WHITELIST_MUT: Inputs.SharedObjectRef({
    objectId:
      '0xe8c8d4c8fd91962b77c8240bccaa2e69ab513ccce77611adaf872464abf453a4',
    initialSharedVersion: '330857976',
    mutable: true,
  }) as ReturnType<typeof Inputs.SharedObjectRef>,
  WHITELIST: Inputs.SharedObjectRef({
    objectId:
      '0xe8c8d4c8fd91962b77c8240bccaa2e69ab513ccce77611adaf872464abf453a4',
    initialSharedVersion: '330857976',
    mutable: false,
  }) as ReturnType<typeof Inputs.SharedObjectRef>,
  SETTINGS: Inputs.SharedObjectRef({
    objectId:
      '0x01fac821aeece5c5203560fb6ba7c4f01401b774e54994afc5b11c4172190111',
    initialSharedVersion: '330857975',
    mutable: false,
  }) as ReturnType<typeof Inputs.SharedObjectRef>,
  SETTINGS_MUT: Inputs.SharedObjectRef({
    objectId:
      '0x01fac821aeece5c5203560fb6ba7c4f01401b774e54994afc5b11c4172190111',
    initialSharedVersion: '330857975',
    mutable: true,
  }) as ReturnType<typeof Inputs.SharedObjectRef>,
} as const;

export const WITNESSES = {
  WHITELIST_ADAPTER: `${PACKAGES.ADAPTERS}::whitelist_adapter::Witness`,
} as const;
