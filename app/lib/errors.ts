/* eslint-disable @typescript-eslint/no-explicit-any */
import { SolanaError } from "@solana/kit";
import {
  getVotingErrorMessage,
  votingErrorMessages,
  type VotingError,
} from "../generated/voting";

export function parseTransactionError(err: unknown): string {
  // Wallet rejection (comes from wallet-standard, not a SolanaError)
  if (err instanceof Error && err.message.includes("User rejected")) {
    return "Transaction was rejected by the wallet.";
  }
  console.log({ err });
  if (
    err !== null &&
    err !== undefined &&
    (err as any).name === "SolanaError"
  ) {
    const solanaError = err as SolanaError;
    const cause = solanaError.cause as SolanaError;

    if (cause.message === "Approval Denied") {
      return "Transaction approval was denied.";
    }

    if ("code" in cause.context && cause.context.code in votingErrorMessages!) {
      return getVotingErrorMessage(cause.context.code as VotingError);
    }

    // For all other errors, kit's SolanaError already has readable messages.
    return fromSolanaError(solanaError);
  }
  return err instanceof Error ? err.message : String(err);
}

function fromSolanaError(err: SolanaError): string {
  const cause = err.cause as { context?: { code?: number } } | undefined;

  if (cause?.context?.code === 2001)
    return "Invalid account tried to sign the transaction.";

  return err.message;
}
