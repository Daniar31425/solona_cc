# RoboNet

**An open coordination and payment network for autonomous machines.**

[Live demo](https://solona-cc.vercel.app) · [GitHub](https://github.com/Daniar31425/solona_cc) · **Network: Solana Devnet**

RoboNet coordinates physical tasks, autonomous machines, proof, and settlement between independent businesses and machine operators. Autonomous last-mile delivery is the first use case.

## Problem

Autonomous machines can perform real-world work, but independent businesses and operators lack a shared layer to create tasks, coordinate machines, prove completion, and settle payments without trusting one central platform.

## Solution

The current MVP demonstrates the full product loop: a store signs a delivery task, RoboNet assigns a demo machine, the mission is simulated, a proof commitment is generated, and the store signs a Devnet SOL settlement to the machine operator.

## Why Solana

Solana is the shared coordination and settlement layer—not decoration. In the current MVP it provides public signed task/completion records, transaction confirmation, test-SOL payment, and independent Explorer verification at demo-friendly speed and cost.

The planned protocol moves task state, machine identity, reward, proof hash, and settlement into program-owned accounts and escrow. That custom program is designed but not yet implemented or deployed.

## How It Works

```text
Store + Phantom
  -> CREATE_DELIVERY Memo on Solana Devnet
  -> simulated machine assignment and mission
  -> SHA-256 commitment of the simulated proof object
  -> COMPLETE_DELIVERY Memo + direct Devnet SOL transfer
  -> machine operator
  -> Solana Explorer verification
```

## Current MVP

- Direct Phantom wallet connection.
- Real signed `CREATE_DELIVERY` Memo transaction on Devnet.
- Clear demo machine selection and mission lifecycle.
- Real SHA-256 commitment generated from the simulated proof object.
- Real signed `COMPLETE_DELIVERY` Memo and direct test-SOL transfer.
- Public Solana Explorer links for creation and settlement.
- Responsive demo UI designed for a 60–90 second walkthrough.

## What Is Real vs Simulated

| Real now | Simulated now | Future physical version |
|---|---|---|
| Phantom signing | Machine availability/matching | Crazyflie flight |
| Solana Devnet transactions | Drone route and telemetry | Camera + AprilTag |
| Memo metadata | Physical pickup/delivery | Computer-vision verification |
| Store-to-Operator test-SOL transfer | Proof source/verifier policy | Hardware-generated proof |
| SHA-256 proof commitment | Browser mission execution | Program escrow settlement |
| Explorer verification | | |

The proof hash demonstrates integrity of the demo proof object. It does not prove that a physical delivery occurred or that a sensor was honest.

## Architecture

The deployed MVP intentionally uses a small, reliable frontend path. The V0.2 protocol architecture is documented separately and includes `NetworkConfig`, `Machine`, and `Delivery` program-owned PDAs, a separate escrow PDA, strict role/state guards, and a permissioned initial verifier.

- [Architecture](docs/architecture.md)
- [Technical plan](docs/technical-plan.md)
- [Solana program design](docs/solana-program.md)
- [Security model](docs/security.md)

## Tech Stack

- React 19 + TypeScript + Vite
- `@solana/web3.js`
- Phantom injected wallet provider
- Solana Devnet and Memo Program
- Web Crypto API for SHA-256
- Vercel

## Solana Integration

`CREATE_DELIVERY` and `COMPLETE_DELIVERY` are JSON metadata records submitted through the Solana Memo Program. Completion also includes a System Program transfer from the connected store wallet to the disclosed operator public address.

This is a direct test-SOL settlement, not escrow. Phantom shows the transaction for explicit approval. The custom RoboNet program and program-controlled escrow remain planned work.

## Proof of Delivery

The browser creates a versioned proof object for the simulated mission and computes its SHA-256 digest. The raw hash is included in the completion Memo. Full images, video, telemetry, customer data, and future CV artifacts remain off-chain. See the [proof model](docs/proof-model.md).

## Machine Network

The current fleet and assignment are demo data. The planned machine registry records durable identity, ownership, capabilities, availability, and completed mission count on Solana while keeping high-volume telemetry off-chain.

## How to Run

Requirements: Node.js 20+ and pnpm.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

For a production check:

```powershell
pnpm build
pnpm preview
```

Enable test networks in Phantom and use only Solana Devnet/test SOL.

## Repository Structure

```text
src/                         React demo application
docs/architecture.md         system boundaries and source of truth
docs/technical-plan.md       V0.2 implementation plan
docs/solana-program.md       planned program, PDA, and escrow design
docs/proof-model.md          proof schema and trust limitations
docs/hardware-integration.md future Crazyflie boundary
docs/security.md             threat model and controls
```

## Future Crazyflie Integration

```text
RoboNet -> Mission API -> Python Bridge -> Crazyflie
        -> Camera / AprilTag -> Computer Vision
        -> Proof object -> SHA-256 -> Solana settlement
```

The browser will depend on a `MachineAdapter` boundary rather than Crazyflie internals. `SimulatorMachineAdapter` is planned first; the physical adapter comes after the digital submission is stable. See [hardware integration](docs/hardware-integration.md).

## Roadmap

1. Submission hardening, Devnet smoke test, and demo recording.
2. Transaction history and state restoration.
3. Simulator extraction behind `MachineAdapter`.
4. Custom Solana program, PDAs, lifecycle tests, and escrow.
5. Operator/verifier dashboards.
6. Controlled Crazyflie and computer-vision integration.

## Hackathon Progress

The stable original MVP is preserved on `main` and tag `hackathon-v1`. V0.2 development happens on branch `v0.2`. The project previously placed sixth at a local Solana hackathon and is now being prepared for a Colosseum submission.

## Security / Testnet Notice

This prototype is Devnet-only and not production-audited. It never asks for a seed phrase, recovery phrase, or private key. No real SOL should be used. Phantom signs every transaction, and the operator recipient is shown before settlement.
