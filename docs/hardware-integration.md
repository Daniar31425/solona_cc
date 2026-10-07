# Future Crazyflie Integration

RoboNet currently simulates the physical mission. This document defines the future hardware boundary without coupling the web application to Crazyflie libraries.

## Target architecture

```text
RoboNet task -> Mission API -> Python Bridge -> Crazyflie Python library
             -> Crazyflie -> Camera / AprilTag -> CV verifier
             -> Proof generator -> RoboNet verifier -> Solana settlement
```

The Python Bridge owns hardware configuration. Browser code never receives radio credentials, wallet private keys, or unrestricted drone control.

## MachineAdapter

```ts
interface MachineAdapter {
  getStatus(machineId: string): Promise<MachineStatus>;
  assignMission(machineId: string, mission: Mission): Promise<void>;
  startMission(machineId: string): Promise<void>;
  getTelemetry(machineId: string): AsyncIterable<Telemetry>;
  abortMission(machineId: string, reason: string): Promise<void>;
}
```

The initial implementation is `SimulatorMachineAdapter`. `CrazyflieMachineAdapter` will translate Mission API responses into the same domain types.

## Mission API draft

### `POST /missions`

```json
{
  "missionId": "MSN-001",
  "deliveryId": "RB-001",
  "machineId": "DRONE-01",
  "pickup": { "type": "local", "id": "ASTANA-HUB" },
  "destination": { "type": "local", "id": "NU-CAMPUS" },
  "packageId": "PKG-001"
}
```

Returns `201` with bridge timestamp. Reusing a mission ID is idempotent.

### `POST /missions/:id/start`

Starts an assigned mission. Unknown, already-running, completed, or aborted missions are rejected.

### `GET /missions/:id/status`

```json
{
  "missionId": "MSN-001",
  "state": "IN_PROGRESS",
  "position": { "frame": "local", "x": 2.4, "y": 1.1, "z": 1.3 },
  "batteryPercent": 81,
  "progressBps": 6200,
  "speedMps": 1.2,
  "observedAt": "2026-10-01T12:00:00Z"
}
```

### `POST /missions/:id/abort`

Requires an authenticated operator and records a reason. Emergency landing remains a bridge/hardware responsibility.

### `POST /missions/:id/proof`

```json
{
  "proof": { "schemaVersion": 1, "deliveryId": "RB-001" },
  "proofHash": "64-lowercase-hex-characters"
}
```

The receiver recomputes the hash. This endpoint never settles funds directly.

## Safety before flight

- authenticated, encrypted bridge communication
- allowlisted machines and operators
- idempotent create/start commands
- heartbeat, timeout, and explicit abort path
- geofence, altitude, battery, and link-loss controls below the web layer
- local manual override and emergency stop
- append-only logs with synchronized timestamps
- staged testing: simulator, propellers-off, tethered, controlled indoor route, then broader trials

Real hardware control remains outside V0.2 until these controls and local operating requirements are reviewed.

