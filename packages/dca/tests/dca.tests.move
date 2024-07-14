#[test_only]
module dca::dca_tests {

    use sui::{
        clock,
        sui::SUI,
        tx_context::new_from_hint,
        test_utils::{destroy, assert_eq},
        coin::{mint_for_testing, burn_for_testing, Coin},
        test_scenario::{Self, take_from_address, next_tx}
    };

    use dca::dca;

    // Time scale
    const MIN: u8 = 1;

    const MINUTE: u64 = 60;
    const MAX_FEE: u64 = 3000000; // 3%

    const MILLISECONDS: u64 = 1000;
    const MAX_U64: u64 = 18446744073709551615;

    const OWNER: address = @0x7;
    const DELEGATEE: address = @0x8;

    public struct USDC has drop {}

    #[test]
    fun test_new() {
        let ctx_mut = &mut ctx();
        let mut clock = clock::create_for_testing(ctx_mut);

        clock.increment_for_testing(15 * MILLISECONDS);

        let coin_in_value = 100;
        let every = 3;
        let number_of_orders = 10;
        let min = 1;
        let max = 2;
        let fee_percent = 77;

        let dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(coin_in_value, ctx_mut),
            every,
            number_of_orders,
            MIN,
            min,
            max,
            fee_percent,
            DELEGATEE,
            ctx_mut
        );

        assert_eq(dca::owner(&dca), OWNER);
        assert_eq(dca::delegatee(&dca), DELEGATEE);
        assert_eq(dca::start_timestamp(&dca), 15);
        assert_eq(dca::last_trade_timestamp(&dca), 0);
        assert_eq(dca::time_scale(&dca), MIN);
        assert_eq(dca::amount_per_trade(&dca), 100 / number_of_orders);
        assert_eq(dca::min(&dca), min);
        assert_eq(dca::max(&dca), max);
        assert_eq(dca::active(&dca), true);
        assert_eq(dca::cooldown(&dca), MINUTE * every);
        assert_eq(dca::input(&dca), 100);
        assert_eq(dca::fee_percent(&dca), fee_percent);
        assert_eq(dca::remaining_orders(&dca), 10);

        destroy(dca);
        destroy(clock);
    }

    #[test]
    #[expected_failure(abort_code = dca::EInvalidFee)]
    fun test_new_invalid_fee() {
        let ctx_mut = &mut ctx();
        let clock = clock::create_for_testing(ctx_mut);

        let coin_in_value = 100;
        let every = 3;
        let number_of_orders = 10;
        let min = 1;
        let max = 2;

        let dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(coin_in_value, ctx_mut),
            every,
            number_of_orders,
            MIN,
            min,
            max,
            MAX_FEE,
            DELEGATEE,
            ctx_mut
        );

        destroy(dca);
        destroy(clock);
    }

    #[test]
    fun test_resolve() {
        let ctx_mut = &mut ctx();
        let mut clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            ctx_mut
        ); 

        clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        assert_eq(dca::active(&dca), true); 
        assert_eq(dca::remaining_orders(&dca), 2);

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(2000, ctx_mut),
            ctx_mut
        );
   
        assert_eq(dca::active(&dca), true); 
        assert_eq(dca::total_owner_output(&dca), 1998);
        assert_eq(dca::remaining_orders(&dca), 1);
        assert_eq(dca::total_delegatee_output(&dca), 2);

        clock::increment_for_testing(&mut clock, 2 * MINUTE * MILLISECONDS);

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(3000, ctx_mut),
            ctx_mut
        );
   
        assert_eq(dca::active(&dca), false); 
        assert_eq(dca::total_owner_output(&dca), 4995);
        assert_eq(dca::remaining_orders(&dca), 0);
        assert_eq(dca::total_delegatee_output(&dca), 5);   

        destroy(dca);
        destroy(clock);
    }

    #[test]
    #[expected_failure(abort_code = dca::EInactive)]
    fun test_resolve_inactive_error() {
        let ctx_mut = &mut ctx();
        let mut clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            ctx_mut
        ); 

        clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        dca.stop(ctx_mut);

        assert_eq(dca::active(&dca), false); 
        assert_eq(dca::remaining_orders(&dca), 2);

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(2000, ctx_mut),
            ctx_mut
        );

        destroy(dca);
        destroy(clock);
    }

    #[test]
    #[expected_failure(abort_code = dca::ETooEarly)]
    fun test_resolve_too_early_error() {
        let ctx_mut = &mut ctx();
        let mut clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            ctx_mut
        ); 

        clock.increment_for_testing((2 * MINUTE * MILLISECONDS) - 1);

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(2000, ctx_mut),
            ctx_mut
        );

        destroy(dca);
        destroy(clock);
    }

    #[test]
    #[expected_failure(abort_code = dca::ESlippage)]
    fun test_resolve_min_slippage_error() {
        let ctx_mut = &mut ctx();
        let mut clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            2001,
            MAX_U64,
            1000000,
            DELEGATEE,
            ctx_mut
        ); 

        clock.increment_for_testing((2 * MINUTE * MILLISECONDS));

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(2000, ctx_mut),
            ctx_mut
        );

        destroy(dca);
        destroy(clock);
    }

    #[test]
    #[expected_failure(abort_code = dca::ESlippage)]
    fun test_resolve_max_slippage_error() {
        let ctx_mut = &mut ctx();
        let mut clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            ctx_mut
        ); 

        clock.increment_for_testing((2 * MINUTE * MILLISECONDS));

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(2000, ctx_mut),
            ctx_mut
        );

        destroy(dca);
        destroy(clock);
    }

    #[test]
    fun test_take() {
        let ctx_mut = &mut ctx();
        let clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            ctx_mut
        ); 

        assert_eq(burn_for_testing(dca::take(&mut dca, ctx_mut)), 50);
        assert_eq(burn_for_testing(dca::take(&mut dca, ctx_mut)), 50);
        assert_eq(burn_for_testing(dca::take(&mut dca, ctx_mut)), 0); 

        destroy(dca);
        destroy(clock);  
    }

    #[test]
    fun test_destroy() {
        let mut scenario = test_scenario::begin(OWNER);

        let scenario_mut = &mut scenario;

        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario_mut));

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, test_scenario::ctx(scenario_mut)),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            test_scenario::ctx(scenario_mut)
        ); 

        clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(2000, test_scenario::ctx(scenario_mut)),
            scenario_mut.ctx()
        );

        next_tx(scenario_mut, OWNER);

        clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        dca.resolve(
            &clock,
            mint_for_testing<USDC>(3000, test_scenario::ctx(scenario_mut)),
            scenario_mut.ctx()
        ); 

        dca.destroy(test_scenario::ctx(scenario_mut));

        next_tx(scenario_mut, OWNER);

        let mut owner_coin = take_from_address<Coin<USDC>>(scenario_mut, OWNER);
        let second_owner_coin = take_from_address<Coin<USDC>>(scenario_mut, OWNER);

        owner_coin.join(second_owner_coin);

        let mut delegatee_coin = take_from_address<Coin<USDC>>(scenario_mut, DELEGATEE);
        let second_delegatee_coin = take_from_address<Coin<USDC>>(scenario_mut, DELEGATEE);

        delegatee_coin.join(second_delegatee_coin);
  
        assert_eq(burn_for_testing(owner_coin), 4995);
        assert_eq(burn_for_testing(delegatee_coin), 5);

        destroy(clock);  
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::EMustBeTheOwner)] 
    fun test_stop_must_be_owner_error() {
        let ctx_mut = &mut ctx();
        let clock = clock::create_for_testing(ctx_mut);

        let mut dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            ctx_mut
        );   

        dca::stop(
            &mut dca,
            &mut new_from_hint(
                @0x9, 
                7, 
                0, 
                0, 
                0
            )
        );

        destroy(dca);
        destroy(clock); 
    }

    #[test]
    #[expected_failure(abort_code = dca::EMustBeInactive)] 
    fun test_stop_must_be_inactive_error() {
        let ctx_mut = &mut ctx();
        let clock = clock::create_for_testing(ctx_mut);

        let dca = dca::new<SUI, USDC>(
            &clock,
            mint_for_testing<SUI>(100, ctx_mut),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            ctx_mut
        );   

        dca::destroy(dca, ctx_mut);
        destroy(clock); 
    }

    fun ctx(): TxContext {
        let ctx = new_from_hint(
            OWNER, 
            7, 
            0, 
            0, 
            0
        );
   
        ctx
    }   
}
