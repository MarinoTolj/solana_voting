"use client";

import { useCallback, useEffect, useState } from "react";
import { Address } from "@solana/kit";

import {
  fetchCandidate,
  fetchPoll,
  findCandidatePda,
  type Poll,
} from "../generated/voting";
import { CandidateCard } from "./candidate-card";
import { Countdown } from "./countdown";
import { PollResult } from "../lib/db-table";
import { useSolanaClient } from "../lib/solana-client-context";
import { toast } from "sonner";
import { parseTransactionError } from "../lib/errors";
import { useStartPoll } from "../hooks/use-start-poll";
import { useEndPoll } from "../hooks/use-end-poll";
import { useClosePoll } from "../hooks/use-close-poll";
import { usePollTimer } from "../hooks/use-poll-timer";
import { PollProvider } from "../lib/poll-context";
import updatePollResults from "../utils/save-poll";

export function PollDetail({ pollPda }: { pollPda: Address<string> }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const client = useSolanaClient();

  const { startPoll, isLoading: isStarting } = useStartPoll(() => loadPoll());
  const { endPoll, isLoading: isEnding } = useEndPoll(() => loadPoll());
  const { handleClosePoll, isLoading: isClosing } = useClosePoll(() =>
    loadPoll()
  );

  const { status, remaining } = usePollTimer(poll);

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
      await updatePollResults(pollResult, pollPda);
    } catch (error) {
      toast(parseTransactionError(error));
    }
  }, [poll, pollPda, client]);

  useEffect(() => {
    if (status === "ENDED") {
      savePoll();
    }
  }, [status, savePoll]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  const handleStartPoll = async () => {
    if (!poll) return;
    await startPoll(poll.pollId);
  };

  const handleEndPoll = async () => {
    if (!poll) return;
    await endPoll(poll.pollId);
  };

  const closePoll = async () => {
    if (!poll) return;
    await handleClosePoll(poll.pollId, poll.candidateAmount, pollPda);
  };

  const isTransactionPending = isStarting || isEnding || isClosing;

  if (loading) {
    return (
      <div className="px-6 py-8 text-center text-muted">Loading poll...</div>
    );
  }

  if (poll == null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 text-center text-destructive">
        Poll not found onchain
      </div>
    );
  }

  return (
    <PollProvider
      poll={poll}
      pollPda={pollPda}
      status={status}
      remaining={remaining}
    >
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
              disabled={isTransactionPending}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {isStarting ? "Starting..." : "Start Poll"}
            </button>
          )}

          <div className="space-y-3 pt-4">
            {Array.from({ length: Number(poll.candidateAmount) }).map(
              (_, i) => (
                <CandidateCard
                  key={i}
                  seeds={{
                    poll: pollPda,
                    candidateId: i,
                  }}
                />
              )
            )}
          </div>
          {status === "ACTIVE" ? (
            <button
              onClick={handleEndPoll}
              disabled={isTransactionPending}
              className="w-full mt-6 px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition"
            >
              {isEnding ? "Ending..." : "End Poll"}
            </button>
          ) : (
            <button
              onClick={closePoll}
              disabled={isTransactionPending}
              className="w-full mt-6 px-4 py-2 rounded-lg bg-destructive text-primary-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition"
            >
              {isClosing ? "Closing..." : "Close Poll"}
            </button>
          )}
        </div>
      </div>
    </PollProvider>
  );
}
