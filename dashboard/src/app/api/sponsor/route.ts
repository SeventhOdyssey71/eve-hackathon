import { NextRequest, NextResponse } from "next/server";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

/**
 * Sponsored transaction endpoint.
 * Accepts a serialized TransactionKind, wraps it in a GasData-bearing transaction
 * signed by the server-side sponsor keypair, and returns the sponsor's signature.
 *
 * The client then combines their own signature with the sponsor signature
 * and submits the dual-signed transaction.
 */
export async function POST(request: NextRequest) {
  const sponsorKey = process.env.FEN_SPONSOR_PRIVATE_KEY;
  if (!sponsorKey) {
    return NextResponse.json(
      { error: "Sponsored transactions not configured" },
      { status: 503 }
    );
  }

  try {
    const { txBytes } = await request.json();
    if (!txBytes || typeof txBytes !== "string") {
      return NextResponse.json(
        { error: "Missing txBytes field" },
        { status: 400 }
      );
    }

    // Reconstruct the keypair from the base64-encoded secret key
    const keypair = Ed25519Keypair.fromSecretKey(sponsorKey);
    const sponsorAddress = keypair.getPublicKey().toSuiAddress();

    // Deserialize the transaction the client built
    const tx = Transaction.from(txBytes);

    // Set the sponsor's gas payment
    tx.setSender(tx.getData().sender || sponsorAddress);
    tx.setGasOwner(sponsorAddress);

    // Build and sign as sponsor
    const { bytes, signature } = await tx.sign({ signer: keypair });

    return NextResponse.json({
      txBytes: bytes,
      sponsorSignature: signature,
      sponsorAddress,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sponsorship failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
