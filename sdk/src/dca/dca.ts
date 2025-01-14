import { bcs } from '@mysten/sui/bcs';
import { SuiClient } from '@mysten/sui/client';
import { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  normalizeSuiAddress,
  SUI_CLOCK_OBJECT_ID,
} from '@mysten/sui/utils';
import { devInspectAndGetResults } from '@polymedia/suitcase-core';
import invariant from 'tiny-invariant';

import {
  DCA,
  DCAConstructorArgs,
  DestroyArgs,
  IsActiveArgs,
  NewAndShareArgs,
  NewAndShareWithRecipientArgs,
  Package,
  SharedObjects,
  StopArgs,
  SwapWhitelistEndArgs,
  SwapWhitelistStartArgs,
} from './dca.types';
import { getDefaultArgs, parseDCAObject } from './utils';

export class DcaSDK {
  #client: SuiClient;
  #packages: Package;
  #sharedObjects: SharedObjects;

  DEFAULT_FEE = 500000n;
  MAX_U64 = 18446744073709551615n;

  constructor(args: DCAConstructorArgs | undefined | null = null) {
    const data = {
      ...getDefaultArgs(),
      ...args,
    };

    invariant(
      data.fullNodeUrl,
      'You must provide fullNodeUrl for this specific network'
    );

    invariant(
      data.packages,
      'You must provide packages for this specific network'
    );

    invariant(
      data.sharedObjects,
      'You must provide sharedObjects for this specific network'
    );

    this.#packages = data.packages;
    this.#sharedObjects = data.sharedObjects;
    this.#client = new SuiClient({ url: data.fullNodeUrl });
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
    witnessType,
    coinIn,
    timeScale,
    every,
    numberOfOrders,
    max = this.MAX_U64,
    min = 0n,
    fee,
    delegatee,
  }: NewAndShareArgs): Transaction {
    invariant(isValidSuiAddress(delegatee), 'Invalid delegatee address');
    invariant(numberOfOrders > 0, 'Number of orders must be greater than 0');

    const dca = tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::new`,
      typeArguments: [coinInType, coinOutType, witnessType],
      arguments: [
        tx.object(this.#sharedObjects.SETTINGS),
        tx.object(this.#sharedObjects.TRADE_POLICY),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(coinIn),
        tx.pure.u64(every),
        tx.pure.u64(numberOfOrders),
        tx.pure.u8(timeScale),
        tx.pure.u64(min),
        tx.pure.u64(max),
        tx.pure.u64(fee ? BigInt(fee * 1e7) : this.DEFAULT_FEE),
        tx.pure.address(delegatee),
      ],
    });

    tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::share`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  newAndShareWithRecipient({
    tx = new Transaction(),
    coinInType,
    coinOutType,
    witnessType,
    coinIn,
    timeScale,
    every,
    numberOfOrders,
    max = this.MAX_U64,
    min = 0n,
    fee,
    delegatee,
    recipient,
  }: NewAndShareWithRecipientArgs): Transaction {
    invariant(isValidSuiAddress(delegatee), 'Invalid delegatee address');
    invariant(numberOfOrders > 0, 'Number of orders must be greater than 0');
    invariant(
      isValidSuiAddress(recipient) &&
        normalizeSuiAddress(recipient) !== normalizeSuiAddress('0x0'),
      'Invalid recipient address'
    );

    const dca = tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::new_with_recipient`,
      typeArguments: [coinInType, coinOutType, witnessType],
      arguments: [
        tx.object(this.#sharedObjects.SETTINGS),
        tx.object(this.#sharedObjects.TRADE_POLICY),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(coinIn),
        tx.pure.u64(every),
        tx.pure.u64(numberOfOrders),
        tx.pure.u8(timeScale),
        tx.pure.u64(min),
        tx.pure.u64(max),
        tx.pure.u64(fee ? BigInt(fee * 1e7) : this.DEFAULT_FEE),
        tx.pure.address(delegatee),
        tx.pure.address(recipient),
      ],
    });

    tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::share`,
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
      target: `${this.#packages.DCA_V5}::dca::active`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    const result = await devInspectAndGetResults(
      this.#client as any,
      tx as any
    );

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
      target: `${this.#packages.DCA_V5}::dca::stop`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  destroy({ dca, coinInType, coinOutType }: DestroyArgs): Transaction {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::destroy`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  stopAndDestroy({ dca, coinInType, coinOutType }: DestroyArgs): Transaction {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::stop`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::destroy`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return tx;
  }

  swapWhitelistStart({
    dca,
    coinInType,
    coinOutType,
    tx = new Transaction(),
  }: SwapWhitelistStartArgs) {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    const [request, coinIn] = tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::request`,
      typeArguments: [coinInType, coinOutType],
      arguments: [tx.object(dca)],
    });

    return {
      coinIn,
      request,
      tx,
    };
  }

  swapWhitelistEnd({
    dca,
    coinInType,
    coinOutType,
    tx = new Transaction(),
    request,
    coinOut,
  }: SwapWhitelistEndArgs) {
    invariant(isValidSuiObjectId(dca), 'Invalid DCA id');

    tx.moveCall({
      target: `${this.#packages.ADAPTERS_V2}::whitelist_adapter::swap`,
      typeArguments: [coinOutType],
      arguments: [
        tx.object(this.#sharedObjects.WHITELIST),
        request as TransactionArgument,
        coinOut,
      ],
    });

    tx.moveCall({
      target: `${this.#packages.DCA_V5}::dca::confirm`,
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
