# RoboNet V0.2 Architecture

## System boundary

```text
Store Phantom wallet
        |
        v
RoboNet Web App ---- reads/writes ----> RoboNet Solana Program (Devnet)
        |                                      |
        | deterministic matching               +-- Machine PDA
        |                                      +-- Delivery PDA
        v                                      +-- Escrow PDA (Devnet SOL)
MachineAdapter
        +-- SimulatorMachineAdapter (current physical layer)
        `-- Mission API -> Python Bridge -> Crazyflie (future)

Proof generator -> canonical bytes -> SHA-256 -> verifier -> Solana
```

## Source of truth

| Data | Source of truth |
|---|---|
| creator, operator, machine owner | Solana accounts |
| delivery status and reward | Delivery PDA |
| funding and settlement | Escrow PDA plus transaction history |
| proof commitment | Delivery PDA `proof_hash` |
| full proof object | off-chain proof store/file |
| matching score and candidates | off-chain deterministic engine |
| battery, position, speed, altitude | MachineAdapter telemetry |
| UI preferences and cached queries | browser storage, never authoritative |

## Entities

- **Store:** Phantom signer that creates and funds a delivery.
- **Machine operator:** owns Machine PDAs and accepts missions.
- **Machine:** registered capability and lifecycle state; telemetry is off-chain.
- **Delivery:** critical on-chain state and references to off-chain details.
- **Mission:** off-chain execution object linking Delivery to MachineAdapter.
- **Proof:** versioned off-chain evidence with an on-chain hash commitment.
- **Settlement:** program-controlled escrow release.
- **Verifier:** explicit authority attesting that the current proof policy passed.

## Matching engine

Matching is deterministic and off-chain. A candidate must be `AVAILABLE`, meet payload capacity, and declare required capabilities. Scoring may combine battery, payload fit, priority compatibility, and availability. Selection is authoritative only after `assign_machine` succeeds on-chain. It is not described as AI.

## Read path

The frontend queries program accounts, decodes them through the program IDL, and reconciles pending transaction signatures. Refresh reconstructs critical state from Devnet. Browser caches may speed rendering but cannot override program state.

## Write path

Every write is a program instruction signed by the appropriate Phantom role, confirmed on Devnet, then followed by an account refetch. Optimistic UI may show `PENDING`, but never a confirmed terminal state before confirmation.

## Current boundary

At Milestone 1, the running application is still V1: Memo instructions, direct Devnet transfer, and in-memory simulation. The V0.2 program, account reader, escrow, dashboards, and MachineAdapter code are specified but not implemented.

