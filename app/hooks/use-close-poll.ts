import { useCallback } from "react";
import { Address } from "@solana/kit";
import {
  getCloseCandidateInstructionAsync,
  getClosePollInstructionAsync,
} from "../generated/voting";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { toast } from "sonner";
import { parseTransactionError } from "../lib/errors";
import closePoll from "../utils/close-poll";

export function useClosePoll(onSuccess?: () => void) {
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();

  const handleClosePoll = useCallback(
    async (
      pollId: bigint,
      candidateAmount: number,
      pollPda: Address<string>
    ) => {
      if (!wallet.signer) {
        toast("Wallet not connected");
        return;
      }

      try {
        const instructions = [];

        for (let i = 0; i < candidateAmount; i++) {
          const instruction = await getCloseCandidateInstructionAsync({
            authority: wallet.signer,
            candidateId: i,
            pollId,
          });
          instructions.push(instruction);
        }

        const instruction = await getClosePollInstructionAsync({
          authority: wallet.signer,
          pollId,
        });
        instructions.push(instruction);

        const signature = await send({ instructions });
        console.log("✅ close poll with signature:", signature);

        await closePoll(pollPda);
        onSuccess?.();
      } catch (error) {
        toast(parseTransactionError(error));
      }
    },
    [wallet.signer, send, onSuccess]
  );

  return { handleClosePoll, isLoading: isSending };
}
