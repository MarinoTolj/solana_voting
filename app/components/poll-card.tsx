"use client";

import { useEffect, useState } from "react";
import { Address, address, createSolanaRpc, isAddress } from "@solana/kit";

import {
  findPollPda,
  type PollSeeds,
} from "../generated/voting/pdas/poll";

import {
  CandidateSeeds,
  fetchPoll,
  type Poll,
} from "../generated/voting";
import InitCandidate from "./init-candidate";
import { CandidateCard } from "./candidate-card";
import { Countdown } from "./countdown";

const rpc = createSolanaRpc(
  "https://api.devnet.solana.com"
);

export function PollCard({ pda }:{pda:string}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);

  const [remaining, setRemaining] = useState<number>(0);
  const [timeToStart, setTimeToStart] = useState<number>(0);
  const [startPoll, setStartPoll] = useState(false);

  const pollPda=pda as Address<typeof pda>;

  useEffect(() => {
    if (!poll){
      return;
    }
    function update() {
      const now = Date.now();
      const end = Number(poll?.pollEnd) * 1000;
      const start = Number(poll?.pollStart) * 1000;
      if (now >= start){
        setStartPoll(true);
        setRemaining(Math.max(end - now, 0));
        setTimeToStart(0);
      }else{
        setTimeToStart(Math.max(start-now, 0));
        setStartPoll(false);
      }
    }

    update(); // run immediately
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    let mounted = true;

    async function loadPoll() {
      try {

        const account = await fetchPoll(
          rpc,
          pollPda
        );

        if (mounted) {
          setPoll(account.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPoll();

    return () => {
      mounted = false;
    };
  }, [pda, pollPda]);
  

  if (!isAddress(pda)){
    return <div>Not a address: {pda}</div>
  }
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!poll) {
    return <div>Poll not found</div>;
  }

  if (remaining<=0 && timeToStart<=0){
    return <div>Voting has ended</div>
  }
  
  return (
    <div>
      <p>Title: {poll.name}</p> 
      <p>Desc: {poll.description}</p>
      <p>
        Number of options:
        {poll.candidateAmount.toString()}
      </p>
      {
        startPoll
          ?<Countdown remaining={remaining}/>
          :<Countdown remaining={timeToStart}/>
      }
      
      <InitCandidate candidateAmount={poll.candidateAmount} pollId={poll.pollId}/>
      { 
      startPoll?
        (
          Array.from({ length: Number(poll.candidateAmount) }).map((_, i) => (
            <CandidateCard 
              seeds={{
                  pollId: poll.pollId,
                  candidateId: i
                }}  
              key={i}
            />
          ))
        ) 
        : null
   
      }
    </div>
  );
}