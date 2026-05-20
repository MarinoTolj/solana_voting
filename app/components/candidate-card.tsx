"use client";

import { useEffect, useState } from "react";
import { createSolanaRpc } from "@solana/kit";

import {
  findPollPda,
  type PollSeeds,
} from "../generated/voting/pdas/poll";

import {
  Candidate,
  CandidateSeeds,
  fetchCandidate,
  fetchPoll,
  findCandidatePda,
  getVoteCandidateInstructionAsync,
  type Poll,
} from "../generated/voting";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";

const rpc = createSolanaRpc(
  "https://api.devnet.solana.com"
);

type Props = {
  seeds:CandidateSeeds;
  startPoll:boolean;
  pollId:bigint;
};

export function CandidateCard({ seeds, startPoll, pollId }: Props) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();

  useEffect(() => {
    let mounted = true;

    async function loadPoll() {
      try {
        const [candidatePda] = await findCandidatePda({
          poll:seeds.poll,
          candidateId:seeds.candidateId,
        });

        const account = await fetchCandidate(
          rpc,
          candidatePda
        );

        if (mounted) {
          setCandidate(account.data);
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
  }, [seeds]);

  const handleVote = async ()=>{
    try {
          
          
          console.log({wallet});
          if (!wallet.signer){
            console.log("Wallet is not defined")
            return;
          }
    
    
          const instruction = await getVoteCandidateInstructionAsync({
            signer: wallet.signer,
            candidateId:seeds.candidateId,
            pollId,
          });
          console.log({instruction});
          const signature = await send({ instructions: [instruction] });
    
          console.log("✅ Vote with signature:", signature);
          
        } catch (err) {
          console.error("❌ ERROR:", err);
        }
  }

  if (loading) {
    return <div className="px-4 py-3 rounded-lg bg-card border border-border text-muted text-sm">Loading option...</div>;
  }

  if (!candidate) {
    return <div className="px-4 py-3 rounded-lg bg-card border border-border text-destructive text-sm">Option not found</div>;
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between hover:bg-card transition">
      <div className="flex-1">
        <h3 className="font-medium text-foreground">{candidate.candidateName}</h3>
        <p className="text-sm text-muted mt-1">
          {candidate.candidateVotes.toString()} vote{candidate.candidateVotes !== 1n ? "s" : ""}
        </p>
      </div>
      <button
        onClick={handleVote}
        disabled={!startPoll || isSending}
        className="ml-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isSending ? "Voting..." : "Vote"}
      </button>
    </div>
  );
}