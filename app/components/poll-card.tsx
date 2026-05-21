"use client";

import { useCallback, useEffect, useState } from "react";
import { Address, createSolanaRpc, isAddress } from "@solana/kit";

import {
  fetchCandidate,
  fetchPoll,
  findCandidatePda,
  getCloseCandidateInstructionAsync,
  getClosePollInstructionAsync,
  getEndPollInstructionAsync,
  getStartPollInstructionAsync,
  type Poll,
} from "../generated/voting";
import { CandidateCard } from "./candidate-card";
import { Countdown } from "./countdown";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import SavePollResults, { PollResult } from "../utils/save-poll";
import ClosePoll from "../utils/close-poll";
import { ClosedPoll } from "./closed-poll";

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

  const loadPoll = useCallback(async () => {
    try {
      const account = await fetchPoll(rpc, pollPda);
      setPoll(account.data);
    } catch (err) {
      console.error(err);
      setPoll(null);
    } finally {
      setLoading(false);
    }
  }, [pollPda]);

  const savePoll=useCallback(async ()=>{
    try {
        if (poll==null) return;

        const pollResult:PollResult={
          totalVotes: 0,
          results: []
        }

        for (let i=0;i<poll.candidateAmount;i++){
          const [candidatePda] = await findCandidatePda({
            poll:pollPda,
            candidateId:i,
          });
  
          const account = await fetchCandidate(
            rpc,
            candidatePda
          );
          pollResult.totalVotes+=Number(account.data.candidateVotes);
          pollResult.results.push({
            candidateId: i,
            votes: Number(account.data.candidateVotes),
            candidateName: account.data.candidateName
          })

        }
        await SavePollResults(pollResult, pollPda);
    } catch (err) {
      console.error(err);
    }
  }, [poll, pollPda]);

  useEffect(() => {
    if (!poll) return;

    async function update() {

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
        await savePoll();
        setRemaining(0);
        clearInterval(interval);
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
    }, [poll, savePoll]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

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

  
  async function handleClosePoll() {
    if (poll==null || wallet.signer==null) return;
    const instructions=[];
    for (let i=0;i<poll.candidateAmount;i++){
          const instruction=await getCloseCandidateInstructionAsync({
            authority: wallet.signer,
            candidateId: i,
            pollId: poll.pollId
          });
          instructions.push(instruction);
    }
    const instruction = await getClosePollInstructionAsync({
      authority: wallet.signer,
      pollId: poll.pollId
    });

    instructions.push(instruction);
    if (status==="NOT_STARTED"){
      await savePoll();
    }
    const signature = await send({ instructions });
    console.log("✅ close poll with signature:", signature);
    await ClosePoll(pollPda);
    await loadPoll();

  }
  async function handleEndPoll() {
    if (poll==null || wallet.signer==null) return;
    
    if (status!=="ACTIVE"){
      return;
    }
    const instruction = await getEndPollInstructionAsync({
      authority: wallet.signer,
      pollId: poll.pollId
    });

    const signature = await send({ instructions:[instruction] });
    console.log("✅ end poll with signature:", signature);
    await loadPoll();

  }

  if (!isAddress(pda)){
    return <div className="px-6 py-8 text-center text-destructive">Invalid address: {pda}</div>
  }

  if (loading) {
    return <div className="px-6 py-8 text-center text-muted">Loading poll...</div>;
  }

  if (!poll) {
    return <ClosedPoll pda={pda}/>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{poll.name}</h1>
          <p className="mt-2 text-foreground/70">{poll.description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted">
          <span>{poll.candidateAmount.toString()} option(s)</span>
          {status === "ACTIVE" && <Countdown remaining={remaining} />}
          {status === "ENDED" && <span className="text-destructive">Voting has ended</span>}
        </div>

        {status === "NOT_STARTED" && (
          <button
            onClick={handleStartPoll}
            disabled={isSending}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition"
          >
            Start Poll
          </button>
        )}

        <div className="space-y-3 pt-4">
          {Array.from({ length: Number(poll.candidateAmount) }).map((_, i) => (
            <CandidateCard
              key={i}
              seeds={{
                poll: pollPda,
                candidateId: i,
              }}
              startPoll={status === "ACTIVE"}
              pollId={poll.pollId}
            />
          ))}
        </div>
        {status === "ACTIVE"?
          <button
            onClick={handleEndPoll}
            disabled={isSending}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition"
          >
            End Poll
          </button>:

          <button
            onClick={handleClosePoll}
            disabled={isSending}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition"
          >
            Close Poll
          </button>
        }

        
      </div>
    </div>
  );
}