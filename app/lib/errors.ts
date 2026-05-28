/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SolanaError,
} from "@solana/kit";
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

  if (
    err !== null &&
    err !== undefined &&
    (err as any).name === "SolanaError"
  ) {
    const solanaError = err as SolanaError;

    if (solanaError.cause !== null) {
      if (solanaError.cause?.context.code in votingErrorMessages!) {
        return getVotingErrorMessage(
          solanaError.cause?.context.code as VotingError
        );
      }

      // For all other errors, kit's SolanaError already has readable messages.
      return fromSolanaError(solanaError);
    }
  }
  return err instanceof Error ? err.message : String(err);
}

function fromSolanaError(err: SolanaError): string {
  if (err.cause?.context.code === 2001)
    return "Invalid account tried to sign the transaction.";

  return err.message;
}
