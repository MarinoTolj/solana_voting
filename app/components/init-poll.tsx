"use client";

import { useWallet } from "../lib/wallet/context";
import {findPollPda, getInitializeCandidateInstructionAsync, getInitializePollInstructionAsync} from "../generated/voting/";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useRouter } from "next/navigation";
import {  useState } from "react";
import handleInsertPoll from "../utils/handle-init-poll";

export default function InitPoll() {
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();
  const [pollName, setPollName] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [duration, setDuration] = useState(""); // in minutes
  const [error, setError] = useState<string | null>(null);
  const [candidateInput, setCandidateInput] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);

  const router=useRouter();


  function validate(durationStr: string) {
    const durationMs = Number(durationStr) * 60 * 1000;

    if (durationMs <= 0) {
      return "Duration must be greater than 0";
    }

    if (candidates.length<2){
      return `Number of option must be at least 2. Current ${candidates.length}`
    }
  }
  
  const handleInitPoll = async (e: React.FormEvent) => {
    try {
      
      
      console.log({wallet});
      if (!wallet.signer){
        console.log("Wallet is not defined")
        return;
      }
      e.preventDefault();

      const err = validate(duration);
      if (err) {
        setError(err);
        return;
      }

      setError(null);

      const pollId=Date.now();
      const [pollPda] = await findPollPda({
        pollId,
      });
      const instructions=[];
      const create_poll_ix = await getInitializePollInstructionAsync({
        signer: wallet.signer,
        pollId,
        description: pollDesc,
        name: pollName,
        poll: pollPda,
        //convert from minutes to seconds
        duration: Number(duration)*60
      });
      instructions.push(create_poll_ix);
      
      for (let idx=0;idx<candidates.length;idx++){
        const instruction = await getInitializeCandidateInstructionAsync({
          signer: wallet.signer,
          pollId,
          candidateName:candidates[idx],
          candidateId: idx
        });

        instructions.push(instruction);
      }

      console.log({instructions});

      const signature = await send({ instructions });
      
      console.log("✅ init poll with signature:", signature);
      await handleInsertPoll(pollId, pollPda, wallet.signer.address);
      router.push(`/poll/${pollPda}`);
      
    } catch (err) {
      console.error("❌ ERROR:", err);
    }
  };
      

  return (
    <div>
      <form onSubmit={handleInitPoll} className="space-y-4">
        <input 
          type="text" 
          onChange={(e) => setPollName(e.target.value)}  
          placeholder="Enter poll name"
        />
        <input 
          type="text" 
          onChange={(e) => setPollDesc(e.target.value)}  
          placeholder="Enter poll description"
        />
        
        <div>
          <label>Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
          />
        </div>
        

        {error && <p style={{ color: "red" }}>{error}</p>}

        
        <input
          type="text"
          value={candidateInput}
          onChange={(e) => setCandidateInput(e.target.value)}
          placeholder="Enter option name"
        />
        <button
          type="button"
          onClick={() => {
            if (!candidateInput.trim()) return;

            setCandidates(prev => [...prev, candidateInput.trim()]);
            setCandidateInput("");
          }}
        >
          Add candidate
        </button>
        {
          candidates.map((candidate, index)=><p key={index}>{candidate}</p>)
        }
        <br />

        <button type="submit">Create Poll</button>
      </form>

    </div>
  );
}