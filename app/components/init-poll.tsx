"use client";

import { useWallet } from "../lib/wallet/context";
import {getInitializePollInstructionAsync} from "../generated/voting/";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";

export default function InitPoll() {
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();
  
  const handleInitPoll = async () => {
    try {
      
      
      console.log({wallet});
      if (!wallet.signer){
        console.log("Wallet is not defined")
        return;
      }


      const instruction = await getInitializePollInstructionAsync({
        signer: wallet.signer,

        pollId:BigInt(1),
        description:"Test vote",
        name: "Vote",
        pollStart:BigInt(0),
        pollEnd:BigInt(1)
      });
      console.log({instruction});
      const signature = await send({ instructions: [instruction] });

      console.log("✅ init poll with signature:", signature);
      
    } catch (err) {
      console.error("❌ ERROR:", err);
    }
  };

  return (
    <div>
      <button onClick={handleInitPoll}>
       Init poll (Hardcoded)
      </button>
    </div>
  );
}