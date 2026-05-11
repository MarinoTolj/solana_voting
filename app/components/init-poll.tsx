"use client";

import { useWallet } from "../lib/wallet/context";
import {findPollPda, getInitializePollInstructionAsync} from "../generated/voting/";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function InitPoll() {
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();
  const [pollName, setPollName] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(""); // in minutes
  const [error, setError] = useState<string | null>(null);
  
  const router=useRouter();


  function validate(start: string, durationStr: string) {
    if (!start || !durationStr) return "Start time and duration are required";

    const startDate = new Date(start).getTime();
    const durationMs = Number(durationStr) * 60 * 1000;

    if (isNaN(startDate) || isNaN(durationMs)) {
      return "Invalid input";
    }

    if (startDate <= Date.now()) {
      return "Start time must be in the future";
    }

    if (durationMs <= 0) {
      return "Duration must be greater than 0";
    }

    const endDate = startDate + durationMs;

    if (endDate <= startDate) {
      return "Invalid duration";
    }

    return null;
  }
  
  const handleInitPoll = async (e: React.FormEvent) => {
    try {
      
      
      console.log({wallet});
      if (!wallet.signer){
        console.log("Wallet is not defined")
        return;
      }
      e.preventDefault();

      const err = validate(startTime, duration);
      if (err) {
        setError(err);
        return;
      }

      setError(null);

      const startDate = new Date(startTime).getTime();
      const durationMs = Number(duration) * 60 * 1000;
      const endDate = startDate + durationMs;

      const start = BigInt(Math.floor(startDate / 1000));
      const end = BigInt(Math.floor(endDate / 1000));

      const pollId=7;
      const [pollPda] = await findPollPda({
        pollId,
      });
      const instruction = await getInitializePollInstructionAsync({
        signer: wallet.signer,
        pollId,
        description:pollDesc,
        name: pollName,
        pollStart:start,
        pollEnd:end,
        poll:pollPda
      });
      console.log({instruction});
      const signature = await send({ instructions: [instruction] });

      console.log("✅ init poll with signature:", signature);
      router.push(`/poll/${pollPda}`);
      
    } catch (err) {
      console.error("❌ ERROR:", err);
    }
  };

  const previewEndTime =
    startTime && duration
      ? new Date(
          new Date(startTime).getTime() +
            Number(duration) * 60 * 1000
        ).toLocaleString()
      : null;
      

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
          <label>Start time</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <label>Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
          />
        </div>
        {previewEndTime && (
          <p>End time: {previewEndTime}</p>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Create Poll</button>
      </form>

    </div>
  );
}