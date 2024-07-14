import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { OwnedObjectRef } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import dotenv from 'dotenv';

import util from 'util';

import { DcaSDK as SDK } from '../dca';

import { OBJECT_IDS } from './constants.script';

dotenv.config();

export const keypair = Ed25519Keypair.fromSecretKey(
  Uint8Array.from(Buffer.from(process.env.KEY!, 'base64')).slice(1)
);

export const client = new SuiClient({ url: getFullnodeUrl('testnet') });

export const DCATestnet = new SDK({
  dcaAddress: OBJECT_IDS.testnet.dca,
  fullNodeUrl: getFullnodeUrl('testnet'),
  adaptersAddress: OBJECT_IDS.testnet.adapters,
  tradePolicyId: OBJECT_IDS.testnet.tradePolicy,
});

export const executeTx = async (tx: Transaction) => {
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
    },
    requestType: 'WaitForLocalExecution',
  });

  // return if the tx hasn't succeed
  if (result.effects?.status?.status !== 'success') {
    console.log('\n\nCreating a new stable pool failed');
    return;
  }

  console.log('SUCCESS!');

  // get all created objects IDs
  const createdObjectIds = result.effects.created!.map(
    (item: OwnedObjectRef) => item.reference.objectId
  );

  // fetch objects data
  return client.multiGetObjects({
    ids: createdObjectIds,
    options: { showContent: true, showType: true, showOwner: true },
  });
};

export const log = (x: unknown) =>
  console.log(util.inspect(x, false, null, true));

export const sleep = async (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const PRECISION = 1000000000000000000n;

export function removeLeadingZeros(address: string): string {
  return (address as any).replaceAll(/0x0+/g, '0x');
}

export async function getCoinOfValue(
  tx: Transaction,
  coinType: string,
  coinValue: bigint
): Promise<TransactionResult> {
  let coinOfValue: TransactionResult;
  coinType = removeLeadingZeros(coinType);
  if (coinType === '0x2::sui::SUI') {
    coinOfValue = tx.splitCoins(tx.gas, [tx.pure.u64(coinValue)]);
  } else {
    const paginatedCoins = await client.getCoins({
      owner: keypair.toSuiAddress(),
      coinType,
    });

    const [firstCoin, ...otherCoins] = paginatedCoins.data;

    const firstCoinInput = tx.object(firstCoin.coinObjectId);

    if (otherCoins.length > 0) {
      tx.mergeCoins(
        firstCoinInput,
        otherCoins.map((coin) => coin.coinObjectId)
      );
    }
    coinOfValue = tx.splitCoins(firstCoinInput, [tx.pure.u64(coinValue)]);
  }
  return coinOfValue;
}
