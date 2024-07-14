import { Transaction, TransactionArgument } from '@mysten/sui/transactions';

export interface DCAConstructorArgs {
  fullNodeUrl?: string;
  packageAddress?: string;
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
  every: bigint;
  numberOfOrders: bigint;
  max?: bigint;
  min?: bigint;
  fee?: number;
  delegatee: string;
}

export interface IsActiveArgs extends DcaArgs {}

export interface StopArgs extends DcaArgs {}

export interface DestroyArgs extends DcaArgs {}

export interface DCA {
  objectId: string;
  owner: string;
  delegatee: string;
  start: bigint;
  lastTrade: bigint;
  every: bigint;
  remainingOrders: bigint;
  timeScale: TimeScale;
  cooldown: bigint;
  coinInBalance: bigint;
  amountPerTrade: bigint;
  min: bigint;
  max: bigint;
  active: boolean;
  fee: bigint;
}
