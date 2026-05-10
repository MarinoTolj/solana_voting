"use client";

import { useWallet } from "../lib/wallet/context";
import {getInitializeCandidateInstructionAsync} from "../generated/voting";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useState } from "react";

export default function InitCandidate() {
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();
  const [candidateName, setCandidateName] = useState("");
  
  const handleInitCandidate = async () => {
    try {
      
      console.log({wallet});
      if (!wallet.signer){
        console.log("Wallet is not defined")
        return;
      }


      const instruction = await getInitializeCandidateInstructionAsync({
        signer: wallet.signer,
        pollId: BigInt(1),
        candidateName
      });
      console.log({instruction});
      const signature = await send({ instructions: [instruction] });

      console.log("✅ init candidate with signature:", signature);
      
    } catch (err) {
      console.error("❌ ERROR:", err);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        onChange={(e) => setCandidateName(e.target.value)}  
        placeholder="Enter option name"
      />

      <button onClick={handleInitCandidate}>
        Add
      </button>
    </div>
  );
}