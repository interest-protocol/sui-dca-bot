module adapter::hop_adapter {
    // === Imports ===

    use sui::coin::Coin;

    use dca::trade_policy::{Self, Request, Admin};

    // === Structs ===

    public struct Hop has drop {}

    // === Public-Mutative Functions ===

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