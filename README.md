# RoboNet

RoboNet is an open coordination and payment network for autonomous machines, starting with autonomous last-mile delivery.

**Track:** Kazakhstan

**Working:** Phantom connection, Solana Devnet, real on-chain create and completion transactions, reward transfer, and Solana Explorer verification.

**Simulated prototype:** autonomous drone mission and physical delivery verification.

## Problem

Autonomous machines can perform physical work, but they lack an open layer for discovering tasks, proving completion, and receiving payments from businesses that do not operate the machines themselves.

## Solution

RoboNet links a physical delivery lifecycle to public, verifiable blockchain actions: a business creates a task, a machine executes it, proof is verified, and the machine operator receives settlement.

## Why Solana

Solana provides fast, inexpensive public transactions for task creation, proof references, and settlement. The current MVP records delivery metadata in Solana Memo instructions and settles the delivery reward with a Devnet SOL transfer.

## Demo

1. Connect Phantom on Solana Devnet.
2. Create a delivery and approve the first transaction.
3. Start the simulated Drone-01 mission.
4. Verify completion and approve the settlement transaction.
5. Open both confirmed transactions in Solana Explorer.

## Architecture

```text
Store
  ↓
RoboNet Web App
  ↓
Solana Devnet (task memo)
  ↓
Delivery Task
  ↓
Autonomous Machine (simulated)
  ↓
Proof of Delivery
  ↓
Solana Settlement (memo + SOL transfer)
```

Video, telemetry, images, GPS data, and computer-vision processing remain off-chain. Only compact task/proof metadata and settlement are submitted on-chain.

## Tech Stack

- React + TypeScript + Vite
- `@solana/web3.js`
- Phantom injected wallet provider
- Solana Devnet

## How to Run

Requirements: Node.js 20+ and pnpm (or npm).

```powershell
pnpm install
pnpm dev
```

Open the local URL shown in the terminal. In Phantom, enable test networks and select Solana Devnet. Never use real SOL for this demo.

## Current MVP

- Direct Phantom wallet connection
- Real signed task-creation transaction on Solana Devnet
- Delivery data attached using the Solana Memo program
- Simulated autonomous delivery timeline
- Real signed completion transaction
- Devnet SOL reward transfer to the configured machine-operator wallet
- Solana Explorer links for both transactions

## Future Roadmap

- Custom Solana program with delivery and machine PDAs
- Escrowed rewards and protocol fees
- Machine identity and reputation
- Computer-vision proof hashes
- Crazyflie and ground-robot hardware integration
- Task discovery for independent machine operators

## Safety

The app never requests or stores recovery phrases or private keys. Phantom signs every transaction. This MVP is configured for Solana Devnet only.
