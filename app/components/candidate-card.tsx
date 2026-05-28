"use client";

import { useEffect, useState } from "react";

import {
  Candidate,
  CandidateSeeds,
  fetchCandidate,
  findCandidatePda,
  getVoteCandidateInstructionAsync,
} from "../generated/voting";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useSolanaClient } from "../lib/solana-client-context";
import { toast } from "sonner";
import { parseTransactionError } from "../lib/errors";

type Props = {
  seeds: CandidateSeeds;
  startPoll: boolean;
  pollId: bigint;
};

export function CandidateCard({ seeds, startPoll, pollId }: Props) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();
  const client = useSolanaClient();

  useEffect(() => {
    let mounted = true;

    async function loadPoll() {
      try {
        const [candidatePda] = await findCandidatePda({
          poll: seeds.poll,
          candidateId: seeds.candidateId,
        });

        const account = await fetchCandidate(client.rpc, candidatePda);

        if (mounted) {
          setCandidate(account.data);
        }
      } catch (error) {
        toast(parseTransactionError(error));
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
  }, [client, seeds]);

  const handleVote = async () => {
    try {
      if (!wallet.signer) {
        console.log("Wallet is not defined");
        return;
      }

      const instruction = await getVoteCandidateInstructionAsync({
        signer: wallet.signer,
        candidateId: seeds.candidateId,
        pollId,
      });

      const signature = await send({ instructions: [instruction] });

      console.log("✅ Vote with signature:", signature);
    } catch (error) {
      toast(parseTransactionError(error));
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-3 rounded-lg bg-card border border-border text-muted text-sm">
        Loading option...
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="px-4 py-3 rounded-lg bg-card border border-border text-destructive text-sm">
        Option not found
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between hover:bg-card transition">
      <div className="flex-1">
        <h3 className="font-medium text-foreground">
          {candidate.candidateName}
        </h3>
        <p className="text-sm text-muted mt-1">
          {candidate.candidateVotes.toString()} vote
          {candidate.candidateVotes !== 1n ? "s" : ""}
        </p>
      </div>
      <button
        onClick={handleVote}
        /* disabled={!startPoll || isSending} */
        className="ml-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isSending ? "Voting..." : "Vote"}
      </button>
    </div>
  );
}
