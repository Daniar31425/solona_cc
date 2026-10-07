# RoboNet V0.2 Technical Plan

Status: Milestone 1 design. The custom Solana program and escrow described here are **planned, not yet deployed**. The preserved `hackathon-v1` tag remains the working demo.

## A. Current architecture

RoboNet V1 is a client-only React/Vite application. `src/App.tsx` owns wallet connection, form state, mission simulation, transaction construction, and rendering.

- Phantom is accessed through the injected `window.phantom.solana` provider.
- Solana is fixed to Devnet through `clusterApiUrl("devnet")`.
- `CREATE_DELIVERY` is a signed Memo instruction. It does not create program state.
- Mission progress is an in-memory sequence of five 650 ms delays.
- `COMPLETE_DELIVERY` is a Memo plus a direct System Program transfer.
- The operator public key is compiled into the frontend.
- Refreshing the page loses delivery state. No localStorage or database is used.
- Solana Explorer links are derived from confirmed transaction signatures.

The blockchain proves that the signer published the memo and made the transfer. It does not currently enforce the delivery lifecycle, proof validity, machine ownership, or settlement authorization.

## B. What can be reused

- The React/Vite application and visual system.
- Phantom connection and user-signing flow.
- Devnet connection, confirmation strategy, and Explorer links.
- Delivery form concepts and the short demo route.
- Off-chain mission simulation as the first `MachineAdapter` implementation.
- Clear labels separating live Devnet actions from simulated physical behavior.
- The product positioning and Kazakhstan logistics use cases.

Memo transactions remain useful as an audit-friendly V1 fallback, but they will not be the V0.2 source of truth.

## C. What must change

1. Critical machine and delivery state moves into program-owned accounts.
2. A validated state machine replaces UI-only sequencing.
3. Machine ownership and operator authorization are enforced on-chain.
4. Reward funding moves from a post-delivery direct transfer to a pre-mission escrow PDA.
5. Proofs use a deterministic schema and real SHA-256 hash; only the hash is on-chain.
6. A verifier role explicitly represents the current trust boundary.
7. Frontend reads program accounts after refresh rather than treating component state as authoritative.
8. Simulator behavior is accessed through `MachineAdapter`, allowing a future Crazyflie bridge.
9. Direct operator addresses move out of source code and come from registered machine state.

## D. Proposed Solana accounts

### NetworkConfig PDA

Seeds: `[b"config"]`.

Fields: `version: u8`, `authority: Pubkey`, `verifier: Pubkey`, `paused: bool`, `bump: u8`, `reserved: [u8; 16]`. Estimated allocation including the Anchor discriminator: 91 bytes.

### Machine PDA

Seeds: `[b"machine", owner, machine_id]`, where `machine_id` is exactly 16 bytes.

Fields: `version: u8`, `machine_id: [u8; 16]`, `owner: Pubkey`, `machine_type: u8`, `payload_grams: u32`, `status: u8`, `capabilities: u32`, `reputation_bps: u16`, `completed_missions: u32`, `bump: u8`, `reserved: [u8; 16]`. Estimated allocation: 90 bytes.

Battery, location, speed, and other telemetry remain off-chain because they are volatile.

### Delivery PDA

Seeds: `[b"delivery", creator, delivery_id]`, where `delivery_id` is exactly 16 bytes.

Fields: `version: u8`, `delivery_id: [u8; 16]`, `creator: Pubkey`, `customer_hash: [u8; 32]`, `machine: Pubkey`, `operator: Pubkey`, `reward_lamports: u64`, `status: u8`, `proof_hash: [u8; 32]`, `created_at: i64`, `updated_at: i64`, `completed_at: i64`, `bump: u8`, `escrow_bump: u8`, `reserved: [u8; 16]`. Estimated allocation: 236 bytes.

### Escrow PDA

Seeds: `[b"escrow", delivery_pda]`.

The escrow is a zero-data, System Program-owned PDA holding only Devnet lamports. The RoboNet program signs for it with canonical seeds during a System Program CPI. Delivery history and escrow funds remain separate, so payout does not require closing the Delivery account.

## E. Delivery state machine

```text
CREATED --fund_delivery--> FUNDED --assign_machine--> ASSIGNED
ASSIGNED --accept_delivery--> ACCEPTED --start_delivery--> IN_PROGRESS
IN_PROGRESS --submit_proof--> ARRIVED --verify_delivery--> VERIFIED
VERIFIED --complete_delivery--> COMPLETED

CREATED ---------------------------> CANCELLED
FUNDED/ASSIGNED (policy permitting) -> CANCELLED + refund
ACCEPTED/IN_PROGRESS/ARRIVED -------> FAILED (verifier/authority resolution)
```

Every instruction accepts only its documented source state. `COMPLETED`, `CANCELLED`, and `FAILED` are terminal. There is no direct `CREATED -> COMPLETED` path.

Machine state changes with the delivery: `AVAILABLE -> ASSIGNED` on assignment, `ASSIGNED -> BUSY` on start, and back to `AVAILABLE` on completion or resolved failure.

## F. Roles and permissions

| Action | Required signer | Guards |
|---|---|---|
| initialize config | deployment authority | singleton config |
| register/update machine | operator | signer equals owner |
| create delivery | store/creator | valid reward and identifiers |
| fund delivery | creator | CREATED; exact reward transferred once |
| assign machine | creator in V0.2 | FUNDED; machine AVAILABLE; capacity/capability checks |
| accept delivery | machine operator | assigned machine owner; ASSIGNED |
| start delivery | machine operator | ACCEPTED; machine ASSIGNED |
| submit proof | machine operator | IN_PROGRESS; nonzero hash |
| verify proof | configured verifier | ARRIVED; submitted hash present |
| complete delivery | any payer/crank | VERIFIED; funded escrow; immutable recipient |
| cancel before assignment | creator | allowed state; atomic refund if funded |
| resolve failure | verifier/authority | explicit Devnet-only policy |

Making completion permissionless after verification improves liveness: the caller cannot redirect funds because the payout recipient is already fixed in Delivery.

## G. Escrow design

`fund_delivery` transfers exactly `reward_lamports` from creator to escrow and changes `CREATED -> FUNDED` atomically. Assignment is impossible before funding.

`complete_delivery` checks `VERIFIED`, derives the expected escrow, checks the immutable operator, transfers the reward through a signed System Program CPI, then writes `COMPLETED`. Solana transaction atomicity prevents partial payout/state updates.

Double settlement is prevented by the status guard and escrow balance. Cancellation/refund is restricted to explicit pre-mission states. V0.2 will not call this production-ready or trustless until tests, Devnet validation, and independent review are complete.

## H. Proof trust model

The full proof stays off-chain. A deterministic serializer creates bytes for a versioned schema and SHA-256 produces the 32-byte digest stored in Delivery.

The hash proves integrity of a presented proof. It does not prove physical delivery or sensor honesty. In V0.2, a configured verifier signs `verify_delivery`; initially it may be a local simulated service. Later the same boundary can be replaced by computer vision, an oracle, or a verifier network.

## I. MachineAdapter design

```ts
interface MachineAdapter {
  getStatus(machineId: string): Promise<MachineStatus>;
  assignMission(machineId: string, mission: Mission): Promise<void>;
  startMission(machineId: string): Promise<void>;
  getTelemetry(machineId: string): AsyncIterable<Telemetry>;
  abortMission(machineId: string, reason: string): Promise<void>;
}
```

`SimulatorMachineAdapter` remains the default. A future `CrazyflieMachineAdapter` talks to a Mission API/Python bridge. UI and delivery orchestration depend on the interface rather than simulator timers.

## J. Proposed repository structure

```text
programs/robonet/            # Anchor program (Milestone 2)
tests/                       # program/integration tests
src/
  features/{wallet,deliveries,machines,missions,settlement}/
  services/solana/
  services/machine/{MachineAdapter,SimulatorMachineAdapter}.ts
  types/
  utils/
docs/
```

The frontend moves incrementally. A folder is created only when code has a clear responsibility to place there.

## K. Migration plan from V1

1. Preserve V1 as `hackathon-v1`; keep `main` stable.
2. Add the program workspace and local-validator tests without changing the V1 frontend path.
3. Deploy a versioned program to Devnet and record its public program ID.
4. Add a V0.2 program client beside the Memo client.
5. Read Machine and Delivery accounts; retain Memo mode as an explicit fallback during development.
6. Move create, assignment, and state transitions to the program.
7. Enable escrow only after guards and failure paths pass tests.
8. Replace direct simulator calls with `MachineAdapter`.
9. Remove the V1 direct settlement path from V0.2 only after full Devnet validation.

Existing Memo deliveries are historical V1 events and will not be represented as program accounts.

## L. Risks

- **Windows toolchain:** Solana CLI, Rust, and Anchor are not installed. WSL2 may be the most predictable build environment; decide during Milestone 2 setup.
- **Verifier centralization:** V0.2 verification is permissioned and must be labeled.
- **Cancellation liveness:** post-acceptance refunds need timeout/dispute rules; the initial resolver is explicitly centralized.
- **Schema upgrades:** fixed-size layouts require versioning, reserved bytes, and explicit migrations.
- **Public RPC reliability:** use configurable Devnet RPC with rate-limit/error handling.
- **Frontend compatibility:** preserve `@solana/web3.js` 1.x initially; evaluate client migration separately.
- **Escrow correctness:** signer seeds, balances, terminal states, and destinations require negative tests.
- **Physical authenticity:** hashes cannot establish sensor truth.

## M. Milestones

0. **Preserve V1:** complete — tag and branch created; architecture audited.
1. **Design:** complete in documentation — accounts, lifecycle, roles, escrow, proof, hardware boundary.
2. **Program vertical slice:** toolchain, Anchor workspace, accounts, transitions, tests.
3. **Frontend program client:** instructions and state restoration from Devnet.
4. **Escrow:** funding, refund, verification, settlement, security tests.
5. **Machine adapter:** simulator and mission orchestration behind the interface.
6. **Proof pipeline:** canonical proof, SHA-256, verifier boundary, integrity tests.
7. **Operator dashboard:** machines, assignments, status, Devnet earnings.
8. **Hardening:** end-to-end tests, documentation verification, Devnet/Vercel deployment.

