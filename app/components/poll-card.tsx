"use client";

import { useEffect, useState } from "react";
import { createSolanaRpc } from "@solana/kit";

import {
  findPollPda,
  type PollSeeds,
} from "../generated/voting/pdas/poll";

import {
  fetchPoll,
  type Poll,
} from "../generated/voting";

const rpc = createSolanaRpc(
  "https://api.devnet.solana.com"
);

export function PollCard({ pollId }: PollSeeds) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPoll() {
      try {
        const [pollPda] = await findPollPda({
          pollId,
        });

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
  }, [pollId]);

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
    </div>
  );
}