import { NextRequest, NextResponse } from "next/server";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const FEN_PACKAGE_ID =
  process.env.NEXT_PUBLIC_FEN_PACKAGE_ID ||
  "0xff753421606a061120d2fcd75df86fdb0682d78051e6e365ec2af81f0f56620a";

const MAX_GAS_BUDGET = 50_000_000; // 0.05 SUI max sponsored gas

// Simple in-memory rate limiter: max 10 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
}

/**
 * Sponsored transaction endpoint.
 * Validates that the transaction only targets the FEN package,
 * enforces a gas budget cap, and rate-limits requests.
 */
export async function POST(request: NextRequest) {
  const sponsorKey = process.env.FEN_SPONSOR_PRIVATE_KEY;
  if (!sponsorKey) {
    return NextResponse.json(
      { error: "Sponsored transactions not configured" },
      { status: 503 }
    );
  }

  // Rate limiting
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
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

    // Deserialize and validate the transaction
    const tx = Transaction.from(txBytes);
    const txData = tx.getData();

    // Validate all MoveCall targets are FEN package only
    for (const command of txData.commands || []) {
      if (command.MoveCall) {
        const target = command.MoveCall.package;
        if (target && target !== FEN_PACKAGE_ID) {
          return NextResponse.json(
            { error: "Only FEN package transactions can be sponsored" },
            { status: 403 }
          );
        }
      }
    }

    // Enforce gas budget cap
    tx.setGasBudget(MAX_GAS_BUDGET);

    const keypair = Ed25519Keypair.fromSecretKey(sponsorKey);
    const sponsorAddress = keypair.getPublicKey().toSuiAddress();

    tx.setSender(txData.sender || sponsorAddress);
    tx.setGasOwner(sponsorAddress);

    const { bytes, signature } = await tx.sign({ signer: keypair });

    return NextResponse.json({
      txBytes: bytes,
      sponsorSignature: signature,
      sponsorAddress,
    });
  } catch {
    return NextResponse.json(
      { error: "Sponsorship failed" },
      { status: 500 }
    );
  }
}
