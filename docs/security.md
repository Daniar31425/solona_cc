# RoboNet V0.2 Security Model

Status: threat model and design requirements, not an audit.

## Assets and trust

Assets include escrowed Devnet SOL, machine ownership/state, delivery lifecycle, payout destination, proof commitment, upgrade authority, and future hardware commands.

V0.2 explicitly trusts the configured verifier to apply its proof policy honestly. Simulator telemetry is demo data. Solana runtime and Phantom key custody are external trust assumptions.

## Threats and controls

| Threat | Control |
|---|---|
| arbitrary payout | operator copied from registered Machine |
| fake machine ownership | owner signer required |
| busy machine assignment | exact AVAILABLE guard |
| unauthorized start | assigned operator plus ACCEPTED state |
| substituted account | canonical PDA seeds and relationship checks |
| substituted escrow | derived from Delivery PDA |
| settlement before proof | VERIFIED-only completion |
| double completion | terminal state plus escrow guard |
| refund after payout | mutually exclusive state paths |
| malformed proof | nonzero `[u8; 32]` and verifier schema checks |
| verifier compromise | replaceable verifier, pause, event trail |
| RPC/frontend misinformation | refetch confirmed program state |
| leaked secrets | no secret keys in source, storage, docs, or logs |
| hardware injection | authenticated bridge, allowlist, local safety controls |

## Cancellation policy

- CREATED: creator may cancel; no funds.
- FUNDED: creator may cancel/refund before assignment.
- ASSIGNED: creator may cancel/refund only before acceptance; machine becomes AVAILABLE.
- ACCEPTED or later: no unilateral creator refund.
- Stalled missions use an explicit verifier/authority resolution path in the initial Devnet prototype. This centralization is disclosed. Permissionless timeouts are deferred until semantics are tested.

## Key management

- Store/operator sign through Phantom; no secrets are requested.
- Deployment and verifier keys never enter the frontend.
- Any Milestone 2 keypair is ignored before generation and stays outside source control.
- Program IDs, RPC URLs, and public addresses are not secrets.

Escrow is not called production-ready or trustless until negative tests pass, Devnet behavior is verified, authorities are documented, and an independent review is complete.

