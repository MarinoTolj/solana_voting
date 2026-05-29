"use client";

import { useCallback, useEffect, useState } from "react";
import { Address } from "@solana/kit";

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
import UpdatePollResults from "../utils/save-poll";
import ClosePoll from "../utils/close-poll";
import { ClosedPoll } from "./closed-poll";
import { PollResult } from "../lib/db-table";
import { useSolanaClient } from "../lib/solana-client-context";
import { toast } from "sonner";
import { parseTransactionError } from "../lib/errors";

type PollStatus = "NOT_STARTED" | "ACTIVE" | "ENDED";

export function PollCard({ pollPda }: { pollPda: Address<string> }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();
  const client = useSolanaClient();

  const [loading, setLoading] = useState(true);

  const [remaining, setRemaining] = useState<number>(0);
  const [status, setStatus] = useState<PollStatus>("NOT_STARTED");

  const loadPoll = useCallback(async () => {
    try {
      const account = await fetchPoll(client.rpc, pollPda);
      setPoll(account.data);
    } catch (error) {
      toast(parseTransactionError(error));
      setPoll(null);
    } finally {
      setLoading(false);
    }
  }, [pollPda, client]);

  const savePoll = useCallback(async () => {
    try {
      if (poll == null) return;

      const pollResult: PollResult = {
        totalVotes: 0,
        results: [],
      };

      for (let i = 0; i < poll.candidateAmount; i++) {
        const [candidatePda] = await findCandidatePda({
          poll: pollPda,
          candidateId: i,
        });

        const account = await fetchCandidate(client.rpc, candidatePda);
        pollResult.totalVotes += Number(account.data.candidateVotes);
        pollResult.results.push({
          candidateId: i,
          votes: Number(account.data.candidateVotes),
          candidateName: account.data.candidateName,
        });
      }
      await UpdatePollResults(pollResult, pollPda);
    } catch (error) {
      toast(parseTransactionError(error));
    }
  }, [poll, pollPda, client]);

  useEffect(() => {
    if (!poll) return;

    async function update() {
      if (!poll) return;

      if (poll.startedAt.__option === "None") {
        setStatus("NOT_STARTED");
        return;
      }

      const now = Date.now();

      const start = Number(poll.startedAt.value) * 1000;

      const end = Number(poll.startedAt.value + poll.duration) * 1000;

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

      setRemaining(Math.max(end - now, 0));
    }

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [poll, savePoll]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  async function handleStartPoll() {
    if (!wallet.signer || !poll) {
      console.log("Wallet is not defined");
      return;
    }
    const start_poll_ix = await getStartPollInstructionAsync({
      signer: wallet.signer,
      pollId: poll.pollId,
    });
    try {
      const signature = await send({ instructions: [start_poll_ix] });

      console.log("✅ start poll with signature:", signature);
      await loadPoll();
    } catch (error) {
      toast(parseTransactionError(error));
    }
  }

  async function handleClosePoll() {
    if (poll == null || wallet.signer == null) return;
    const instructions = [];
    for (let i = 0; i < poll.candidateAmount; i++) {
      const instruction = await getCloseCandidateInstructionAsync({
        authority: wallet.signer,
        candidateId: i,
        pollId: poll.pollId,
      });
      instructions.push(instruction);
    }
    const instruction = await getClosePollInstructionAsync({
      authority: wallet.signer,
      pollId: poll.pollId,
    });

    instructions.push(instruction);
    if (status === "NOT_STARTED") {
      await savePoll();
    }
    try {
      const signature = await send({ instructions });
      console.log("✅ close poll with signature:", signature);
      await ClosePoll(pollPda);
      await loadPoll();
    } catch (error) {
      toast(parseTransactionError(error));
    }
  }
  async function handleEndPoll() {
    if (poll == null || wallet.signer == null) return;

    if (status !== "ACTIVE") {
      return;
    }
    const instruction = await getEndPollInstructionAsync({
      authority: wallet.signer,
      pollId: poll.pollId,
    });
    try {
      const signature = await send({ instructions: [instruction] });
      console.log("✅ end poll with signature:", signature);
      await loadPoll();
    } catch (error) {
      toast(parseTransactionError(error));
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-8 text-center text-muted">Loading poll...</div>
    );
  }

  if (!poll) {
    console.log({ poll });
    return <ClosedPoll pollPda={pollPda} />;
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
          {status === "ENDED" && (
            <span className="text-destructive">Voting has ended</span>
          )}
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
        {status === "ACTIVE" ? (
          <button
            onClick={handleEndPoll}
            disabled={isSending}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition"
          >
            End Poll
          </button>
        ) : (
          <button
            onClick={handleClosePoll}
            disabled={isSending}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition"
          >
            Close Poll
          </button>
        )}
      </div>
    </div>
  );
}
