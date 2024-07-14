import { bcs } from '@mysten/sui/bcs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import {
  isValidSuiAddress,
  SUI_CLOCK_OBJECT_ID,
  isValidSuiObjectId,
} from '@mysten/sui/utils';
import { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import invariant from 'tiny-invariant';
import { devInspectAndGetResults } from '@polymedia/suitcase-core';
import { parseDCAObject } from './utils';
import {
  DCAConstructorArgs,
  NewArgs,
  IsActiveArgs,
  StopArgs,
  DestroyArgs,
  DCA,
  SwapHopStartArgs,
  SwapHopEndArgs,
} from './dca.types';

export class DcaSDK {
  #client: SuiClient;
  #defaultDcaPackage = '0x2';
  #defaultAdaptersPackage = '0x0';
  #defaultTradePolicyId = '0x3';
  #tradePolicy: string;
  #dcaPackage: string;
  #adapters: string;
  #MAX_U64 = 18446744073709551615n;
  #defaultFee = 500000n;

  constructor(args?: DCAConstructorArgs | undefined) {
    this.#dcaPackage = args?.dcaAddress
      ? args.dcaAddress
      : this.#defaultDcaPackage;
    this.#adapters = args?.adaptersAddress
      ? args.adaptersAddress
      : this.#defaultAdaptersPackage;
    this.#client = new SuiClient({
      url: args?.fullNodeUrl ? args.fullNodeUrl : getFullnodeUrl('mainnet'),
    });
    this.#tradePolicy = args?.tradePolicyId
      ? args.tradePolicyId
      : this.#defaultTradePolicyId;
  }

  async get(objectId: string): Promise<DCA> {
    invariant(isValidSuiObjectId(objectId), 'Invalid DCA id');

    const obj = await this.#client.getObject({
      id: objectId,
      options: { showContent: true, showType: true },
    });

    return parseDCAObject(obj);
  }

  newAndShare({
    tx = new Transaction(),
    coinInType,
    coinOutType,
    coinIn,
    timeScale,
    every,
    numberOfOrders,
    max = this.#MAX_U64,
    min = 0n,
    fee,
    delegatee,
  }: NewArgs): Transaction {
    invariant(isValidSuiAddress(delegatee), 'Invalid delegatee address');
    invariant(numberOfOrders > 0, 'Number of orders must be greater than 0');

    let dca = tx.moveCall({
      target: `${this.#dcaPackage}::dca::new`,
      typeArguments: [coinInType, coinOutType],
      arguments: [
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(coinIn),
        tx.pure.u64(every),
        tx.pure.u64(numberOfOrders),
        tx.pure.u8(timeScale),
        tx.pure.u64(min),
        tx.pure.u64(max),
        tx.pure.u64(fee ? BigInt(fee * 1e7) : this.#defaultFee),
        tx.pure.address(delegatee),
      ],
    });

    tx.moveCall({
      target: `${this.#dcaPackage}::dca::share`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  async isActive({
    dca,
    coinInType,
    coinOutType,
  }: IsActiveArgs): Promise<boolean> {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.#dcaPackage}::dca::active`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    const result = await devInspectAndGetResults(this.#client, tx);

    const values = result[result.length - 1].returnValues;

    invariant(values && values.length, 'Failed to get values');

    return values.map((elem) => {
      const [x] = elem;
      return bcs.Bool.parse(new Uint8Array(x));
    })[0];
  }

  stop({ dca, coinInType, coinOutType }: StopArgs): Transaction {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.#dcaPackage}::dca::stop`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  destroy({ dca, coinInType, coinOutType }: DestroyArgs): Transaction {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.#dcaPackage}::dca::destroy`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  stopAndDestroy({ dca, coinInType, coinOutType }: DestroyArgs): Transaction {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.#dcaPackage}::dca::stop`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    tx.moveCall({
      target: `${this.#dcaPackage}::dca::destroy`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  swapHopStart({
    dca,
    coinInType,
    coinOutType,
    tx = new Transaction(),
  }: SwapHopStartArgs) {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const [request, coinIn] = tx.moveCall({
      target: `${this.#dcaPackage}::trade_policy::request`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(this.#tradePolicy), tx.object(dca)],
    });

    return {
      coinIn,
      request,
      tx,
    };
  }

  swapHopEnd({
    dca,
    coinInType,
    coinOutType,
    tx = new Transaction(),
    request,
    coinOut,
    admin,
  }: SwapHopEndArgs) {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    tx.moveCall({
      target: `${this.#adapters}::hop_adapter::swap`,
      typeArguments: [coinOutType],
      arguments: [tx.object(admin), request as TransactionArgument, coinOut],
    });

    tx.moveCall({
      target: `${this.#dcaPackage}::trade_policy::confirm`,
      typeArguments: [coinInType, coinOutType],
      arguments: [
        tx.object(dca),
        tx.object(SUI_CLOCK_OBJECT_ID),
        request as TransactionArgument,
      ],
    });

    return tx;
  }
}
