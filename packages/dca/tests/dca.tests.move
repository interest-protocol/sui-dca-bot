#[test_only]
module dca::dca_tests {
    use std::type_name;
    use sui::{
        sui::SUI,
        clock::{Self, Clock},
        coin::{mint_for_testing, Coin},
        test_utils::{destroy, assert_eq},
        test_scenario::{Self as ts, Scenario},
    };

    use dca::dca::{Self, TradePolicy, Settings, Admin};

    // Time scale
    const MIN: u8 = 1;

    const MINUTE: u64 = 60;
    const MAX_FEE: u64 = 30000000; // 3%

    const MILLISECONDS: u64 = 1000;
    const MAX_U64: u64 = 18446744073709551615;

    const OWNER: address = @0x7;
    const DELEGATEE: address = @0x8;
    const ALICE: address = @0xa11c3;
    const JOSE: address = @0x1234567890;

    public struct USDC has drop {}
    public struct ValidWitness has drop {}
    public struct InvalidWitness has drop {}

    #[test]
    fun test_new() {
        let coin_in_value = 100;
        let every = 3;
        let number_of_orders = 10;
        let min = 1;
        let max = 2;
        let fee_percent = 77;

        let mut world = start_world();

        world.clock.increment_for_testing(15 * MILLISECONDS);

        let dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(coin_in_value, world.scenario.ctx()),
            every,
            number_of_orders,
            MIN,
            min,
            max,
            fee_percent,
            DELEGATEE,
            world.scenario.ctx(),
        );

        assert_eq(dca.owner(), OWNER);
        assert_eq(dca.treasury(), @treasury);
        assert_eq(dca.start_timestamp(), 15);
        assert_eq(dca.last_trade_timestamp(), 0);
        assert_eq(dca.time_scale(), MIN);
        assert_eq(dca.amount_per_trade(), 100 / number_of_orders);
        assert_eq(dca.min(), min);
        assert_eq(dca.max(), max);
        assert_eq(dca.active(), true);
        assert_eq(dca.cooldown(), MINUTE * every);
        assert_eq(dca.input(), 100);
        assert_eq(dca.fee_percent(), fee_percent);
        assert_eq(dca.remaining_orders(), 10);

        dca.share();

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EInvalidFee)]
    fun test_new_invalid_fee() {
        let coin_in_value = 100;
        let every = 3;
        let number_of_orders = 10;
        let min = 1;
        let max = 2;

        let mut world = start_world();

        let dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(coin_in_value, world.scenario.ctx()),
            every,
            number_of_orders,
            MIN,
            min,
            max,
            MAX_FEE,
            DELEGATEE,
            world.scenario.ctx(),
        );

        dca.share();

        world.end();
    }

    #[test]
    fun test_resolve() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        assert_eq(dca.active(), true);
        assert_eq(dca.remaining_orders(), 2);
        assert_eq(dca.recipient(), OWNER);

        let (mut request, input) = dca.request(world.scenario.ctx());

        assert_eq(input.burn_for_testing(), 50);

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        assert_eq(dca::active(&dca), true);
        assert_eq(dca::total_owner_output(&dca), 1999);
        assert_eq(dca::remaining_orders(&dca), 1);
        assert_eq(dca::total_delegatee_output(&dca), 1);

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        assert_eq(input.burn_for_testing(), 50);

        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        assert_eq(dca::active(&dca), false);
        assert_eq(dca::total_owner_output(&dca), 4998);
        assert_eq(dca::remaining_orders(&dca), 0);
        assert_eq(dca::total_delegatee_output(&dca), 2);

        dca.share();
        world.end();
    }

    #[test]
    fun test_confirm_with_recipient() {
        let mut world = start_world(); 

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        let mut dca = dca::new_with_recipient<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            JOSE,
            world.scenario.ctx(),
        );

        assert_eq(dca.recipient(), JOSE); 
        assert_eq(dca.owner(), OWNER);
        assert_eq(dca.owner() != JOSE, true);

        let (mut request, input) = dca.request(world.scenario.ctx());

        input.burn_for_testing(); 

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        world.scenario.next_tx(OWNER);

        let owner_coin = world.scenario.take_from_address<Coin<USDC>>(JOSE);
        let treasury_coin = world.scenario.take_from_address<Coin<USDC>>(@treasury);

        assert_eq(owner_coin.burn_for_testing(), 1999);
        assert_eq(treasury_coin.burn_for_testing(), 1);
        
        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EInactive)]
    fun test_resolve_inactive_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        dca.stop(world.scenario.ctx());

        assert_eq(dca::active(&dca), false);
        assert_eq(dca::remaining_orders(&dca), 2);

        let (mut request, input) = dca.request(world.scenario.ctx());

        assert_eq(input.burn_for_testing(), 50);

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::ETooEarly)]
    fun test_resolve_too_early_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing((2 * MINUTE * MILLISECONDS) - 1);

        let (mut request, input) = dca.request(world.scenario.ctx());

        input.burn_for_testing();

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::ESlippage)]
    fun test_resolve_min_slippage_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            2001,
            MAX_U64,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing((2 * MINUTE * MILLISECONDS));

        let (mut request, input) = dca.request(world.scenario.ctx());

        input.burn_for_testing();

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::ESlippage)]
    fun test_resolve_max_slippage_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing((2 * MINUTE * MILLISECONDS));

        let (mut request, input) = dca.request(world.scenario.ctx());

        input.burn_for_testing();

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        destroy(dca);

        world.end();
    }

    #[test]
    fun test_take() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        assert_eq(dca.take_for_testing(world.scenario.ctx()).burn_for_testing(), 50);
        assert_eq(dca.take_for_testing(world.scenario.ctx()).burn_for_testing(), 50);
        assert_eq(dca.take_for_testing(world.scenario.ctx()).burn_for_testing(), 0);

        destroy(dca);

        world.end();
    }

    #[test]
    fun test_destroy() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            MAX_U64,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        input.burn_for_testing();

        request.add(ValidWitness {}, mint_for_testing<USDC>(2000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        world.scenario.next_tx(OWNER);

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        input.burn_for_testing();

        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        dca.destroy(world.scenario.ctx());

        world.scenario.next_tx(OWNER);

        let mut owner_coin = world.scenario.take_from_address<Coin<USDC>>(OWNER);
        let second_owner_coin = world.scenario.take_from_address<Coin<USDC>>(OWNER);

        owner_coin.join(second_owner_coin);

        let mut treasury_coin = world.scenario.take_from_address<Coin<USDC>>(@treasury);
        let second_treasury_coin = world.scenario.take_from_address<Coin<USDC>>(@treasury);

        treasury_coin.join(second_treasury_coin);

        assert_eq(owner_coin.burn_for_testing(), 4998);
        assert_eq(treasury_coin.burn_for_testing(), 2);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EMustBeTheOwner)]
    fun test_stop_must_be_owner_error() {
        let mut world = start_world();

        world.scenario.next_tx(ALICE);

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.scenario.next_tx(OWNER);

        dca.stop(world.scenario.ctx());

        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EMustBeInactive)]
    fun test_stop_must_be_inactive_error() {
        let mut world = start_world();

        let dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        dca::destroy(dca, world.scenario.ctx());

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EInvalidWitness)]
    fun test_new_error_invalid_witness() {
        let mut world = start_world();

        let dca = dca::new<SUI, USDC, InvalidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing<SUI>(100, world.scenario.ctx()),
            2,
            2,
            MIN,
            100,
            1999,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        dca.share();
        world.end();
    }

    #[test]
    fun test_request() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing(1000, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            10_000,
            0,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(120 * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        assert_eq(input.burn_for_testing(), 500);
        assert_eq(world.trade_policy.whitelist(), vector[type_name::get<ValidWitness>()]);
        assert_eq(request.dca(), object::id_address(&dca));
        assert_eq(request.rule(), option::none());
        assert_eq(request.output(), 0);

        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        dca.share();
        world.end();
    }

    #[test]
    fun test_add() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing(1000, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            10_000,
            0,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(120 * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        assert_eq(request.rule(), option::some(type_name::get<ValidWitness>()));
        assert_eq(request.output(), 3_000);

        destroy(input);
        destroy(dca);
        destroy(request);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::ERuleAlreadyAdded)]
    fun test_add_rule_already_added_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing(1000, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            10_000,
            0,
            DELEGATEE,
            world.scenario.ctx(),
        );

        let (mut request, input) = dca.request(world.scenario.ctx());

        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));
        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        destroy(dca);
        destroy(request);
        destroy(input);

        world.end();
    }

    #[test]
    fun test_confirm() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing(1000, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            10_000,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        request.add(ValidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        assert_eq(dca.total_owner_output(), 0);
        assert_eq(dca.remaining_orders(), 2);
        assert_eq(dca.total_delegatee_output(), 0);

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        assert_eq(dca.total_owner_output(), 2999);
        assert_eq(dca.remaining_orders(), 1);
        assert_eq(dca.total_delegatee_output(), 1);

        destroy(input);
        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EMustHaveARule)]
    fun test_confirm_must_have_a_rule_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing(1000, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            10_000,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        let (request, input) = dca.request(world.scenario.ctx());

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        destroy(input);
        destroy(dca);

        world.end();
    }

    #[test]
    #[expected_failure(abort_code = dca::EInvalidRule)]
    fun test_confirm_invalid_rule_error() {
        let mut world = start_world();

        let mut dca = dca::new<SUI, USDC, ValidWitness>(
            &world.settings,
            &world.trade_policy,
            &world.clock,
            mint_for_testing(1000, world.scenario.ctx()),
            2,
            2,
            MIN,
            0,
            10_000,
            1000000,
            DELEGATEE,
            world.scenario.ctx(),
        );

        world.clock.increment_for_testing(2 * MINUTE * MILLISECONDS);

        let (mut request, input) = dca.request(world.scenario.ctx());

        request.add(InvalidWitness {}, mint_for_testing<USDC>(3000, world.scenario.ctx()));

        dca.confirm(
            &world.clock,
            request,
            world.scenario.ctx(),
        );

        destroy(input);
        destroy(dca);

        world.end();
    }

    #[test]
    fun test_disapprove() {
        let mut world = start_world();

        assert_eq(world.trade_policy.whitelist(), vector[type_name::get<ValidWitness>()]);

        let cap = &world.admin;

        world.trade_policy.disapprove<ValidWitness>(cap);

        assert_eq(world.trade_policy.whitelist(), vector[]);

        world.end();
    }

    public struct World {
        scenario: Scenario,
        settings: Settings,
        trade_policy: TradePolicy,
        clock: Clock,
        admin: Admin,
    }

    fun start_world(): World {
        let mut scenario = ts::begin(OWNER);

        dca::init_for_testing(scenario.ctx());

        scenario.next_tx(OWNER);

        let clock = clock::create_for_testing(scenario.ctx());
    
        let settings = scenario.take_shared<Settings>();
        let mut trade_policy = scenario.take_shared<TradePolicy>();
        let admin = scenario.take_from_sender<Admin>();

        trade_policy.approve<ValidWitness>(&admin);

        World {
            scenario,
            settings,
            clock,
            trade_policy,
            admin,
        }
    }

    fun end(world: World) {
        destroy(world);
    }
}
