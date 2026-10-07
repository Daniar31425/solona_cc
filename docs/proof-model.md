# Proof of Delivery Model

## Purpose and limit

The proof commitment detects modification of an evidence object. SHA-256 does not establish sensor honesty or physical delivery. Authenticity depends on the verifier and evidence provenance.

## Version 1 object

```json
{
  "schemaVersion": 1,
  "deliveryId": "RB-001",
  "machineId": "DRONE-01",
  "packageId": "PKG-001",
  "destination": "NU-CAMPUS",
  "timestamp": "2026-10-01T12:00:00.000Z",
  "verificationMethod": "SIMULATED_CV",
  "verificationConfidenceBps": 9870,
  "telemetrySummary": {
    "durationMs": 9200,
    "distanceMm": 850000,
    "minimumBatteryBps": 8100
  }
}
```

Evidence avoids floating point: percentages use basis points, distance uses millimetres, and duration uses milliseconds.

## Canonical serialization

V0.2 uses a schema-specific serializer with fields in the exact order above, UTF-8 encoding, no insignificant whitespace, decimal integers, uppercase enums, and normalized UTC timestamps. Unknown fields are rejected for a schema version.

```text
proof_hash = SHA-256(canonical_utf8_bytes)
```

UI may display lowercase hex; Solana stores the raw 32 bytes.

## Verification flow

1. Operator submits full proof and claimed hash.
2. Service canonicalizes and recomputes the hash.
3. Verifier policy checks required evidence and thresholds.
4. Operator submits the 32-byte hash to Delivery.
5. Configured verifier signs `verify_delivery` for the same hash.
6. Anyone may complete; escrow releases only from VERIFIED.

Images, video, detailed telemetry, AprilTag detections, and CV artifacts remain off-chain. Public customer data and raw media are not stored in Delivery.

