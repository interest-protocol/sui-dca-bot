import { getFullnodeUrl, SuiClient, SuiExecutionResult, SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/dist/cjs/transactions';
import { normalizeSuiAddress, normalizeSuiObjectId } from '@mysten/sui/utils';
import { pathOr } from 'ramda';
import invariant from 'tiny-invariant';

import { PACKAGES, SHARED_OBJECTS } from './constants';
import { DCA, DCAConstructorArgs, TimeScale } from './dca.types';

const getTimeScale = (x: number) => {
  invariant(TimeScale.Month >= x, 'Invalid time scale');

  if (x === 0) return TimeScale.Seconds;
  if (x === 1) return TimeScale.Minutes;
  if (x === 2) return TimeScale.Hour;
  if (x === 3) return TimeScale.Day;
  if (x === 4) return TimeScale.Week;
  return TimeScale.Month;
};

export const parseDCAObject = (x: SuiObjectResponse): DCA => {
  const data = x.data?.content;

  invariant(data, 'Object has no content');

  return {
    objectId: normalizeSuiObjectId(pathOr('', ['data', 'objectId'], x)),
    type: pathOr('', ['type'], data),
    owner: normalizeSuiAddress(pathOr('', ['fields', 'owner'], data)),
    delegatee: normalizeSuiAddress(pathOr('', ['fields', 'delegatee'], data)),
    start: BigInt(pathOr(0, ['fields', 'start_timestamp'], data)),
    lastTrade: BigInt(pathOr(0, ['fields', 'last_trade_timestamp'], data)),
    every: +pathOr(0, ['fields', 'every'], data),
    remainingOrders: +pathOr(0, ['fields', 'remaining_orders'], data),
    timeScale: getTimeScale(+pathOr(0, ['fields', 'time_scale'], data)),
    cooldown: BigInt(pathOr(0, ['fields', 'cooldown'], data)),
    coinInBalance: BigInt(pathOr(0, ['fields', 'input_balance'], data)),
    amountPerTrade: BigInt(pathOr(0, ['fields', 'amount_per_trade'], data)),
    min: BigInt(pathOr(0, ['fields', 'min'], data)),
    max: BigInt(pathOr(0, ['fields', 'max'], data)),
    active: pathOr(false, ['fields', 'active'], data),
    fee: BigInt(pathOr(0, ['fields', 'fee_percent'], data)),
    totalOwnerOutput: BigInt(
      pathOr(0, ['fields', 'total_delegatee_output'], data)
    ),
    totalDelegateeOutput: BigInt(
      pathOr(0, ['fields', 'total_owner_output'], data)
    ),
    witness: pathOr('', ['fields', 'witness', 'fields', 'name'], data),
  };
};

export const getDefaultArgs = (): DCAConstructorArgs => ({
  packages: PACKAGES,
  fullNodeUrl: getFullnodeUrl('mainnet'),
  sharedObjects: SHARED_OBJECTS,
});
export async function devInspectAndGetExecutionResults(
  suiClient: SuiClient,
  tx: Transaction | Uint8Array | string,
  sender = "0x7777777777777777777777777777777777777777777777777777777777777777",
): Promise<SuiExecutionResult[]>
{
  const resp = await suiClient.devInspectTransactionBlock({
      sender: sender,
      transactionBlock: tx,
  });
  if (resp.error) {
      throw new Error(`Response error: ${JSON.stringify(resp, null, 2)}`);
  }
  if (!resp.results?.length) {
      throw new Error(`Response has no results: ${JSON.stringify(resp, null, 2)}`);
  }
  return resp.results;
}
