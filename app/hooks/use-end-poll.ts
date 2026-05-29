import { useCallback } from "react";
import { Address } from "@solana/kit";
import { getEndPollInstructionAsync } from "../generated/voting";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { toast } from "sonner";
import { parseTransactionError } from "../lib/errors";

export function useEndPoll(onSuccess?: () => void) {
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();

  const endPoll = useCallback(
    async (pollId: bigint) => {
      if (!wallet.signer) {
        toast("Wallet not connected");
        return;
      }

      try {
        const instruction = await getEndPollInstructionAsync({
          authority: wallet.signer,
          pollId,
        });

        const signature = await send({ instructions: [instruction] });
        console.log("✅ end poll with signature:", signature);
        onSuccess?.();
      } catch (error) {
        toast(parseTransactionError(error));
      }
    },
    [wallet.signer, send, onSuccess]
  );

  return { endPoll, isLoading: isSending };
}
