import { useCallback } from "react";
import { getStartPollInstructionAsync } from "../generated/voting";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { toast } from "sonner";
import { parseTransactionError } from "../lib/errors";

export function useStartPoll(onSuccess?: () => void) {
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();

  const startPoll = useCallback(
    async (pollId: bigint) => {
      if (!wallet.signer) {
        toast("Wallet not connected");
        return;
      }

      try {
        const instruction = await getStartPollInstructionAsync({
          signer: wallet.signer,
          pollId,
        });

        const signature = await send({ instructions: [instruction] });
        console.log("✅ start poll with signature:", signature);
        onSuccess?.();
      } catch (error) {
        toast(parseTransactionError(error));
      }
    },
    [wallet.signer, send, onSuccess]
  );

  return { startPoll, isLoading: isSending };
}
