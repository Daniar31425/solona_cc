# RoboNet Solana Program Design

Status: design only; no RoboNet program is deployed yet.

## PDA map

```text
NetworkConfig = PDA("config")
Machine       = PDA("machine", owner_pubkey, machine_id_16)
Delivery      = PDA("delivery", creator_pubkey, delivery_id_16)
Escrow        = PDA("escrow", delivery_pda)
```

Canonical bumps are stored in program-owned accounts and revalidated with Anchor `seeds` and `bump` constraints.

## Planned instructions

| Instruction | Result |
|---|---|
| `initialize_config` | creates singleton config |
| `register_machine` | creates AVAILABLE machine owned by signer |
| `create_delivery` | creates CREATED delivery |
| `fund_delivery` | CREATED -> FUNDED; transfers reward to escrow |
| `assign_machine` | FUNDED -> ASSIGNED; machine -> ASSIGNED |
| `accept_delivery` | ASSIGNED -> ACCEPTED; operator signs |
| `start_delivery` | ACCEPTED -> IN_PROGRESS; machine -> BUSY |
| `submit_proof` | IN_PROGRESS -> ARRIVED; stores SHA-256 hash |
| `verify_delivery` | ARRIVED -> VERIFIED; verifier signs |
| `complete_delivery` | VERIFIED -> COMPLETED; releases escrow once |
| `cancel_delivery` | permitted pre-mission state -> CANCELLED/refund |
| `resolve_failed_delivery` | explicit Devnet dispute path -> FAILED |

`fund_delivery` is separate so CREATED is visible, funding idempotence is testable, and an unfunded task cannot execute.

## Invariants

- PDA seeds bind accounts to immutable owners/identifiers.
- Assigned operator is copied from `machine.owner`, never supplied as an arbitrary payout account.
- Assignment requires a FUNDED delivery and AVAILABLE compatible machine.
- Only assigned operator can accept, start, and submit proof.
- Only configured verifier can mark a proof VERIFIED.
- Settlement recipient equals immutable delivery operator.
- Settlement requires VERIFIED and atomically writes COMPLETED.
- Terminal states cannot transition.
- Refund and payout paths are mutually exclusive.
- Client-provided bumps are never trusted without PDA derivation.

## Escrow

```text
creator --System transfer--> escrow PDA
             fund_delivery: CREATED -> FUNDED

escrow PDA --signed System CPI--> immutable operator
             complete_delivery: VERIFIED -> COMPLETED
```

The PDA has no private key. The program signs with canonical seeds. Delivery state remains after settlement.

## Testing gates before Devnet

- all allowed and forbidden transitions
- wrong signer for every privileged instruction
- substituted machine, operator, delivery, and escrow accounts
- double/incorrect funding
- missing/zero proof
- verification before arrival
- settlement before verification and settlement twice
- cancellation after start
- refund and payout destination constraints
- atomic rollback when transfer CPI fails

## Toolchain status

The current Windows environment has Node.js and pnpm but no `solana`, `rustc`, `cargo`, `anchor`, or `avm` commands. Milestone 2 begins with a reproducible toolchain decision and version lock. No program or deployment keypair will be committed.

