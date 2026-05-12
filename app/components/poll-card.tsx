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
  getStartPollInstructionAsync,
  type Poll,
} from "../generated/voting";
import { CandidateCard } from "./candidate-card";
import { Countdown } from "./countdown";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { start } from "repl";

const rpc = createSolanaRpc(
  "https://api.devnet.solana.com"
);

type PollStatus =
  | "NOT_STARTED"
  | "ACTIVE"
  | "ENDED";



export function PollCard({ pda }:{pda:string}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();
  
  const [loading, setLoading] = useState(true);

  const [remaining, setRemaining] = useState<number>(0);
  const [status, setStatus] = useState<PollStatus>("NOT_STARTED");

  const pollPda=pda as Address<typeof pda>;

  useEffect(() => {
    if (!poll) return;

    function update() {

      if (!poll) return;

      if (poll.startedAt.__option === "None") {
        setStatus("NOT_STARTED");
        return;
      }

      const now = Date.now();

      const start =
        Number(poll.startedAt.value) * 1000;

      const end =
        Number(
          poll.startedAt.value + poll.duration
        ) * 1000;

      if (now < start) {
        setStatus("NOT_STARTED");
        return;
      }

      if (now >= end) {
        setStatus("ENDED");
        setRemaining(0);
        return;
      }

      setStatus("ACTIVE");

      setRemaining(
        Math.max(end - now, 0)
      );
    }

    update();

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

  async function handleStartPoll(){
    if (!wallet.signer || !poll){
        console.log("Wallet is not defined")
        return;
      }
    const start_poll_ix = await getStartPollInstructionAsync({
      signer: wallet.signer,
      pollId:poll.pollId
    });
    const signature = await send({ instructions:[start_poll_ix] });
    
    console.log("✅ start poll with signature:", signature);
    await loadPoll();
  }
  
  async function loadPoll() {
    const account = await fetchPoll(rpc, pollPda);
    setPoll(account.data);
  }

  if (!isAddress(pda)){
    return <div>Not a address: {pda}</div>
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!poll) {
    return <div>Poll not found</div>;
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
        status === "NOT_STARTED" && (
          <button onClick={handleStartPoll}>
            Start poll
          </button>
        )
      }

      {
        status === "ACTIVE" && (
          <Countdown remaining={remaining} />
        )
      }
      {
        status === "ENDED" && (
          <div>Voting has ended</div>
        )
      }
      
      { 
          Array.from({ length: Number(poll.candidateAmount) }).map((_, i) => (
            <CandidateCard 
              seeds={{
                  pollId: poll.pollId,
                  candidateId: i
                }}  
                startPoll={status === "ACTIVE"}
                key={i}
            />
          ))
   
      }
    </div>
  );
}