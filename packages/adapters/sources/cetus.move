module adapter::admin_adapter {
    // === Imports ===

    use sui::{
        clock::Clock,
        coin::{Self, Coin},

    };

    use cetus::router;

    use cetus_clmm::{
        pool::Pool,
        config::GlobalConfig
    };

    use dca::trade_policy::{Self, Request};

    // === Structs ===

    public struct Cetus has drop {}

    // === Public-Mutative Functions ===

    public fun swap_a<A, B>(
        clock: &Clock,
        config: &GlobalConfig,
        request: &mut Request<B>,
        pool: &mut Pool<A, B>,
        coin_a: Coin<A>,
        sqrt_price_limit: u128,
        arg_8: bool,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin_a);

        let (output_a, output_b) = router::swap(
            config,
            pool,
            coin_a,
            coin::zero(ctx),
            true,
            true,
            amount,
            sqrt_price_limit,
            arg_8,
            clock,
            ctx
        );

        resolve(request, output_a, output_b);
    }

    public fun swap_b<A, B>(
        clock: &Clock,
        config: &GlobalConfig,
        request: &mut Request<A>,
        pool: &mut Pool<A, B>,
        coin_b: Coin<B>,
        sqrt_price_limit: u128,
        arg_8: bool,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin_b);

        let (output_a, output_b) = router::swap(
            config,
            pool,
            coin::zero(ctx),
            coin_b,
            false,
            true,
            amount,
            sqrt_price_limit,
            arg_8,
            clock,
            ctx
        );

        resolve(request, output_b, output_a); 
    }

    // === Private Functions ===

    fun resolve<Input, Output>(request: &mut Request<Output>, extra: Coin<Input>, output: Coin<Output>) {
        transfer::public_transfer(extra, request.owner());
        trade_policy::add<Cetus, Output>(request, Cetus {}, output);   
    }
}