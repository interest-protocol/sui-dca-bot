module adapter::hop_adapter {
    // === Imports ===

    use sui::coin::Coin;

    use dca::trade_policy::{Self, Request};

    // === Structs ===

    public struct Hop has drop {}

    public struct Admin has key, store {
        id: UID
    }

    // === Public-Mutative Functions ===

    fun init(ctx: &mut TxContext) {
        transfer::public_transfer(Admin { id: object::new(ctx) }, ctx.sender());
    }

    public fun swap<Output>(
        _: &Admin,
        request: &mut Request<Output>,
        output: Coin<Output>,
    ) {
        resolve(request, output);
    }

    // === Private Functions ===

    fun resolve<Output>(request: &mut Request<Output>, output: Coin<Output>) {
        trade_policy::add<Hop, Output>(request, Hop {}, output);   
    }
}