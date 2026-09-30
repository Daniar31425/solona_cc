import { useEffect, useMemo, useState } from "react";
import { Buffer } from "buffer";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
  on: (event: "connect" | "disconnect", callback: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
  }
}

type Delivery = {
  id: string;
  pickup: string;
  destination: string;
  reward: number;
  createSignature: string;
  completeSignature?: string;
};

const OPERATOR_WALLET = new PublicKey("HHjvrGwtA8eGb6BV92sqt6rWAUtXTJhwkGvSrpsATwXX");
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const STEPS = ["Mission accepted", "Package picked up", "In transit", "Destination reached", "Verification"];

function shortKey(value: string) {
  return `${value.slice(0, 5)}…${value.slice(-5)}`;
}

function explorer(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export default function App() {
  const connection = useMemo(() => new Connection(clusterApiUrl("devnet"), "confirmed"), []);
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [pickup, setPickup] = useState("Store A");
  const [destination, setDestination] = useState("Customer B");
  const [reward, setReward] = useState("0.01");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const provider = window.phantom?.solana;

  useEffect(() => {
    if (!provider) return;
    provider.on("connect", () => provider.publicKey && setWallet(provider.publicKey));
    provider.on("disconnect", () => setWallet(null));
  }, [provider]);

  async function connectWallet() {
    if (!provider?.isPhantom) {
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
      setMessage("Install Phantom, switch it to Solana Devnet, then reload this page.");
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      const response = await provider.connect();
      setWallet(response.publicKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wallet connection was cancelled.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTransaction(memo: Record<string, unknown>, transferSol = 0) {
    if (!provider || !wallet) throw new Error("Connect Phantom first.");

    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: wallet, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM,
      data: Buffer.from(JSON.stringify(memo), "utf8"),
    });
    const transaction = new Transaction().add(memoInstruction);

    if (transferSol > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet,
          toPubkey: OPERATOR_WALLET,
          lamports: Math.round(transferSol * LAMPORTS_PER_SOL),
        }),
      );
    }

    const latest = await connection.getLatestBlockhash("confirmed");
    transaction.feePayer = wallet;
    transaction.recentBlockhash = latest.blockhash;
    const { signature } = await provider.signAndSendTransaction(transaction);
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
    return signature;
  }

  async function createDelivery() {
    const parsedReward = Number(reward);
    if (!pickup.trim() || !destination.trim()) {
      setMessage("Add both pickup and destination.");
      return;
    }
    if (!Number.isFinite(parsedReward) || parsedReward <= 0) {
      setMessage("Reward must be greater than 0 SOL.");
      return;
    }

    const id = `RB-${Date.now().toString().slice(-6)}`;
    try {
      setBusy(true);
      setMessage("Approve the CREATE DELIVERY transaction in Phantom…");
      const signature = await sendTransaction({
        protocol: "RoboNet",
        action: "CREATE_DELIVERY",
        deliveryId: id,
        pickup: pickup.trim(),
        destination: destination.trim(),
        rewardSol: parsedReward,
        courier: "Drone-01",
      });
      setDelivery({ id, pickup: pickup.trim(), destination: destination.trim(), reward: parsedReward, createSignature: signature });
      setStep(-1);
      setMessage("Delivery confirmed on Solana Devnet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function simulateMission() {
    setBusy(true);
    setMessage("Drone-01 is executing the route…");
    for (let index = 0; index < STEPS.length; index += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      setStep(index);
    }
    setBusy(false);
    setMessage("Physical delivery simulated. Proof is ready for settlement.");
  }

  async function verifyAndSettle() {
    if (!delivery) return;
    try {
      setBusy(true);
      setMessage(`Approve the ${delivery.reward} SOL settlement in Phantom…`);
      const signature = await sendTransaction(
        {
          protocol: "RoboNet",
          action: "COMPLETE_DELIVERY",
          deliveryId: delivery.id,
          proof: "SIMULATED_PROOF_VERIFIED",
          courier: "Drone-01",
        },
        delivery.reward,
      );
      setDelivery({ ...delivery, completeSignature: signature });
      setMessage("Proof verified and settlement confirmed on Solana Devnet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Settlement failed.");
    } finally {
      setBusy(false);
    }
  }

  function resetDemo() {
    setDelivery(null);
    setStep(-1);
    setMessage("");
  }

  return (
    <main className="app-shell">
      <nav>
        <div className="brand"><span className="brand-mark">R</span> ROBONET</div>
        <div className="nav-actions">
          <span className="network"><i /> Solana Devnet</span>
          <button className="wallet-button" onClick={connectWallet} disabled={busy}>
            {wallet ? shortKey(wallet.toBase58()) : "Connect Phantom"}
          </button>
        </div>
      </nav>

      <header className="hero">
        <div>
          <p className="eyebrow">AUTONOMOUS MACHINE NETWORK</p>
          <h1>Physical work.<br /><span>On-chain trust.</span></h1>
          <p className="hero-copy">An open coordination and payment network for autonomous machines, starting with last-mile delivery.</p>
          <div className="truth-labels">
            <span>● SOLANA — LIVE DEVNET</span>
            <span>◇ AUTONOMOUS MISSION — SIMULATED PROTOTYPE</span>
          </div>
        </div>
        <div className="signal-card">
          <div className="radar"><span>✦</span></div>
          <div><strong>2 MACHINES</strong><small>ONLINE & READY</small></div>
        </div>
      </header>

      <section className="machine-section">
        <div className="section-title"><h2>Available machines</h2><span>LIVE FLEET</span></div>
        <div className="machine-grid">
          <article className="machine-card active">
            <div className="machine-icon">✣</div><div><h3>Drone-01</h3><p>Autonomous aerial courier</p></div><span className="status">AVAILABLE</span>
          </article>
          <article className="machine-card">
            <div className="machine-icon">▣</div><div><h3>Robot-02</h3><p>Ground delivery robot</p></div><span className="status">AVAILABLE</span>
          </article>
        </div>
      </section>

      {!delivery ? (
        <section className="panel create-panel">
          <div className="panel-heading"><div><p className="eyebrow">NEW TASK</p><h2>Create delivery</h2></div><span className="step-number">01</span></div>
          <div className="form-grid">
            <label>Pickup<input value={pickup} onChange={(event) => setPickup(event.target.value)} /></label>
            <div className="route-arrow">→</div>
            <label>Destination<input value={destination} onChange={(event) => setDestination(event.target.value)} /></label>
            <label>Reward<div className="reward-field"><input type="number" min="0.0001" step="0.001" value={reward} onChange={(event) => setReward(event.target.value)} /><span>SOL</span></div></label>
          </div>
          <button className="primary" onClick={wallet ? createDelivery : connectWallet} disabled={busy}>
            {busy ? "Waiting for Phantom…" : wallet ? "Create delivery on Solana  ↗" : "Connect Phantom to continue"}
          </button>
        </section>
      ) : (
        <section className={`panel delivery-panel ${delivery.completeSignature ? "complete" : ""}`}>
          <div className="panel-heading">
            <div><p className="eyebrow">DELIVERY {delivery.id}</p><h2>{delivery.completeSignature ? "Delivery completed ✓" : "Mission in progress"}</h2></div>
            <span className="chain-badge">SOLANA CONFIRMED</span>
          </div>

          <div className="route-map">
            <div><span>●</span><small>PICKUP</small><strong>{delivery.pickup}</strong></div>
            <div className="flight-path"><i style={{ width: `${step < 0 ? 4 : Math.min(100, (step + 1) * 20)}%` }} /><b style={{ left: `${step < 0 ? 4 : Math.min(96, (step + 1) * 20)}%` }}>✣</b></div>
            <div className="destination"><span>◆</span><small>DESTINATION</small><strong>{delivery.destination}</strong></div>
          </div>

          <div className="delivery-meta">
            <div><small>COURIER</small><strong>Drone-01</strong></div>
            <div><small>REWARD</small><strong>{delivery.reward} SOL</strong></div>
            <div><small>CREATE TX</small><a href={explorer(delivery.createSignature)} target="_blank" rel="noreferrer">{shortKey(delivery.createSignature)} ↗</a></div>
          </div>

          <ol className="timeline">
            {STEPS.map((label, index) => <li key={label} className={index <= step ? "done" : index === step + 1 ? "current" : ""}><span>{index <= step ? "✓" : index + 1}</span>{label}</li>)}
          </ol>

          {delivery.completeSignature ? (
            <div className="settlement-box">
              <div><small>PROOF OF DELIVERY</small><strong>VERIFIED</strong></div>
              <div><small>SETTLEMENT</small><strong>CONFIRMED</strong></div>
              <a href={explorer(delivery.completeSignature)} target="_blank" rel="noreferrer">View settlement on Explorer ↗</a>
              <button className="secondary" onClick={resetDemo}>New delivery</button>
            </div>
          ) : step === STEPS.length - 1 ? (
            <button className="primary" onClick={verifyAndSettle} disabled={busy}>{busy ? "Waiting for Phantom…" : `Verify & settle ${delivery.reward} SOL  ↗`}</button>
          ) : (
            <button className="primary" onClick={simulateMission} disabled={busy}>{busy ? "Mission running…" : "Start mission  ▶"}</button>
          )}
        </section>
      )}

      {message && <div className="toast" role="status"><span />{message}</div>}
      <section className="kazakhstan">
        <p className="eyebrow">BUILT FOR KAZAKHSTAN</p>
        <h2>Autonomous logistics for cities, campuses, industrial sites and remote communities.</h2>
      </section>
      <footer><span>ROBONET PROTOCOL · MVP</span><span>DEVNET ONLY · DO NOT USE REAL SOL</span></footer>
    </main>
  );
}
