# RoboNet

**An open coordination and payment network for autonomous machines.**

First use case: autonomous last-mile delivery for cities, campuses, industrial sites, warehouses, medicine delivery, and remote communities in Kazakhstan.

## Problem

Autonomous machines are becoming capable of real-world work, but they lack an open economic layer for discovering tasks, accepting work, proving completion, and receiving payments across organizational boundaries.

## Solution

RoboNet coordinates a physical-task lifecycle between a store, a machine operator, an autonomous machine, a verifier, and a settlement layer. Solana is used for critical task state and payments; high-volume telemetry and evidence remain off-chain.

## Why Solana

Solana provides public account state, program-enforced authorization, deterministic PDAs, atomic transactions, and low-cost settlement. RoboNet remains on **Devnet / test SOL** during V0.2 development.

## Architecture

```text
STORE
  -> ROBONET
  -> SOLANA TASK
  -> MACHINE MATCHING
  -> AUTONOMOUS MACHINE
  -> PROOF OF DELIVERY
  -> SOLANA SETTLEMENT
  -> MACHINE OPERATOR
```

See [architecture](docs/architecture.md) and the [V0.2 technical plan](docs/technical-plan.md).

## Current V0.2

V0.2 is developed on the `v0.2` branch. Milestone 0 and Milestone 1 are complete:

- working hackathon version preserved as `hackathon-v1`;
- current frontend and security limitations audited;
- Solana accounts, lifecycle, roles, escrow, proof, and hardware boundaries designed;
- custom program, escrow, account reader, and MachineAdapter are **not implemented or deployed yet**.

## On-chain Architecture

Planned accounts:

- `NetworkConfig` PDA: authority, verifier, pause state;
- `Machine` PDA: owner, capability, payload, status, completed missions;
- `Delivery` PDA: creator, machine/operator, reward, state, proof hash;
- System-owned Escrow PDA: holds Devnet SOL until verified completion or valid refund.

Details: [Solana program design](docs/solana-program.md).

## Machine Registry

Machines will be registered by an operator signature. On-chain fields describe ownership, payload, capabilities, status, reputation, and mission count. Volatile battery, location, altitude, and speed remain off-chain.

## Delivery Lifecycle

```text
CREATED -> FUNDED -> ASSIGNED -> ACCEPTED -> IN_PROGRESS
        -> ARRIVED -> VERIFIED -> COMPLETED
```

`CANCELLED` and `FAILED` are terminal alternatives. The program will reject impossible or unauthorized transitions.

## Proof of Delivery

The full versioned proof remains off-chain. RoboNet commits its deterministic SHA-256 hash to Delivery. A hash proves integrity of the presented proof; it does not prove that the physical source was honest. V0.2 begins with an explicit permissioned verifier.

Details: [proof model](docs/proof-model.md).

## Escrow

The planned flow locks Devnet SOL before assignment, then releases it from a PDA only after verification. Refund and payout paths are state-gated and mutually exclusive. This is not production-ready or trustless until implemented, tested, deployed, and reviewed.

## Simulator

The existing browser mission is a **simulated physical prototype**. V0.2 will retain it behind `MachineAdapter` so development, demos, and tests do not require hardware.

## Future Crazyflie Integration

```text
RoboNet Task -> Mission API -> Python Bridge -> Crazyflie
             -> Camera / AprilTag -> Computer Vision
             -> Proof -> Solana settlement
```

The bridge API and safety boundary are specified in [hardware integration](docs/hardware-integration.md). No real flight control is implemented yet.

## Security Model

The design validates signer roles, PDA relationships, machine availability, exact state transitions, immutable payout destination, proof presence, and single settlement. No seed phrase or private key belongs in the frontend or repository.

See [security model](docs/security.md).

## Devnet

All blockchain activity uses Solana Devnet and test SOL. Mainnet deployment is outside V0.2 scope.

## How to Run

Requirements: Node.js 20+ and pnpm.

```powershell
pnpm install
pnpm dev
```

In Phantom, enable test networks and select Solana Devnet. Never use real SOL for this demo.

## Testing

The preserved frontend currently has a production build check:

```powershell
pnpm build
```

Milestone 2 will add program tests for transitions, authorization, account substitution, double funding/completion, proof guards, refunds, and settlement atomicity. Test coverage is not claimed before those tests exist.

## Roadmap

1. Anchor toolchain and minimal program vertical slice.
2. Frontend program account reads/writes.
3. Devnet SOL escrow and settlement.
4. Simulator extraction behind `MachineAdapter`.
5. Deterministic proof and verifier pipeline.
6. Operator and network dashboards.
7. Devnet hardening, testing, and deployment.
8. Crazyflie bridge and controlled physical trials.

No RoboNet token, NFT, DAO, staking, or prediction-market feature is planned.

## Hackathon Origin

RoboNet V1 was built for a Solana hackathon in the Kazakhstan track. It demonstrated Phantom connection, real Devnet Memo transactions, a simulated Drone-01 mission, a real completion transaction, direct test-SOL reward transfer, and Explorer verification.

The stable version is preserved at tag `hackathon-v1` and on `main`. V0.2 development happens on branch `v0.2`.
