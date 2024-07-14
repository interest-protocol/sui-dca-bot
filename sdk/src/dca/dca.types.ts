import { Transaction, TransactionArgument } from '@mysten/sui/transactions';

export interface DCAConstructorArgs {
  fullNodeUrl?: string;
  dcaAddress?: string;
  adaptersAddress?: string;
  tradePolicyId?: string;
}

export enum TimeScale {
  Seconds,
  Minutes,
  Hour,
  Day,
  Week,
  Month,
}

interface MaybeTx {
  tx?: Transaction;
}

interface DcaArgs {
  coinInType: string;
  coinOutType: string;
  dca: string;
}

export interface NewArgs extends MaybeTx {
  coinInType: string;
  coinOutType: string;
  coinIn: TransactionArgument;
  timeScale: TimeScale;
  every: number;
  numberOfOrders: number;
  max?: bigint;
  min?: bigint;
  fee?: number;
  delegatee: string;
}

export interface NestedResult {}

export interface IsActiveArgs extends DcaArgs {}

export interface StopArgs extends DcaArgs {}

export interface DestroyArgs extends DcaArgs {}

export interface SwapHopStartArgs extends DcaArgs, MaybeTx {}

export interface SwapHopEndArgs extends DcaArgs, MaybeTx {
  coinOut: TransactionArgument;
  request: NestedResult;
  admin: string;
}

export interface DCA {
  objectId: string;
  type: string;
  owner: string;
  delegatee: string;
  start: bigint;
  lastTrade: bigint;
  every: number;
  remainingOrders: number;
  timeScale: TimeScale;
  cooldown: bigint;
  coinInBalance: bigint;
  amountPerTrade: bigint;
  min: bigint;
  max: bigint;
  active: boolean;
  fee: bigint;
  totalOwnerOutput: bigint;
  totalDelegateeOutput: bigint;
}
