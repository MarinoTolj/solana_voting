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
};

export function CandidateCard({ seeds, startPoll }: Props) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();
  const { send , isSending} = useSendTransaction();

  useEffect(() => {
    let mounted = true;

    async function loadPoll() {
      try {
        const [candidatePda] = await findCandidatePda({
          pollId:seeds.pollId,
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
            pollId:seeds.pollId,
          });
          console.log({instruction});
          const signature = await send({ instructions: [instruction] });
    
          console.log("✅ Vote with signature:", signature);
          
        } catch (err) {
          console.error("❌ ERROR:", err);
        }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!candidate) {
    return <div>Candidate not found</div>;
  }


  return (
    <div>
      <p>Name: {candidate.candidateName}</p>
      <p>Votes: {candidate.candidateVotes}</p>
      <p>SP: {startPoll}</p>
      <button onClick={handleVote} disabled={!startPoll}>
        Vote
      </button>
      
    </div>
  );
}