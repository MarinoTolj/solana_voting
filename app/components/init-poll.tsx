"use client";

import { useWallet } from "../lib/wallet/context";
import {
  findPollPda,
  getInitializeCandidateInstructionAsync,
  getInitializePollInstructionAsync,
} from "../generated/voting/";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import InsertPoll from "../utils/insert-poll";
import { PollInsert } from "../lib/db-table";
import { parseTransactionError } from "../lib/errors";
import { toast } from "sonner";

export default function InitPoll() {
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();
  const [pollName, setPollName] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [duration, setDuration] = useState(""); // in minutes
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [candidateInput, setCandidateInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);

  const router = useRouter();

  function validate() {
    let isValid = true;

    if (!pollName.trim()) {
      setNameError("Poll name is required");
      isValid = false;
    } else {
      setNameError(null);
    }

    if (!pollDesc.trim()) {
      setDescError("Poll description is required");
      isValid = false;
    } else {
      setDescError(null);
    }

    if (!duration) {
      setDurationError("Duration is required");
      isValid = false;
    } else {
      const durationMs = Number(duration) * 60 * 1000;
      if (durationMs <= 0) {
        setDurationError("Duration must be greater than 0");
        isValid = false;
      } else {
        setDurationError(null);
      }
    }

    if (candidates.length < 2) {
      setOptionsError(
        `You must provide at least 2 options. Current: ${candidates.length}`
      );
      isValid = false;
    } else {
      setOptionsError(null);
    }

    return isValid;
  }

  const handleAddCandidate = () => {
    const trimmedInput = candidateInput.trim();

    if (!trimmedInput) {
      setAddError("Option name cannot be empty");
      return;
    }

    if (
      candidates.some((c) => c.toLowerCase() === trimmedInput.toLowerCase())
    ) {
      setAddError("This option already exists");
      return;
    }

    setCandidates((prev) => [...prev, trimmedInput]);
    setCandidateInput("");
    setAddError(null);
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
    setAddError(null);
  };

  const handleInitPoll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      console.log({ wallet });
      if (!wallet.signer) {
        console.log("Wallet is not defined");
        return;
      }

      const pollId = Date.now();
      const [pollPda] = await findPollPda({
        pollId,
      });
      const instructions = [];
      const create_poll_ix = await getInitializePollInstructionAsync({
        signer: wallet.signer,
        pollId,
        description: pollDesc,
        name: pollName,
        poll: pollPda,
        //convert from minutes to seconds
        duration: Number(duration) * 60,
      });
      instructions.push(create_poll_ix);

      for (let idx = 0; idx < candidates.length; idx++) {
        const instruction = await getInitializeCandidateInstructionAsync({
          signer: wallet.signer,
          pollId,
          candidateName: candidates[idx],
          candidateId: idx,
        });

        instructions.push(instruction);
      }

      console.log({ instructions });

      const signature = await send({ instructions });

      console.log("✅ init poll with signature:", signature);
      const pollInsert: PollInsert = {
        created_by: wallet.signer.address,
        poll_id: pollId,
        pda: pollPda,
        name: pollName,
        description: pollDesc,
      };
      await InsertPoll(pollInsert);
      router.push(`/poll/${pollPda}`);
    } catch (error) {
      toast(parseTransactionError(error));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <form onSubmit={handleInitPoll} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Poll Name</label>
          <input
            type="text"
            onChange={(e) => {
              setPollName(e.target.value);
              setNameError(null);
            }}
            value={pollName}
            placeholder="Enter poll name"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {nameError && (
            <p className="mt-1.5 text-sm text-destructive">{nameError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Poll Description
          </label>
          <input
            type="text"
            onChange={(e) => {
              setPollDesc(e.target.value);
              setDescError(null);
            }}
            value={pollDesc}
            placeholder="Enter poll description"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {descError && (
            <p className="mt-1.5 text-sm text-destructive">{descError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setDurationError(null);
            }}
            min={1}
            placeholder="Enter duration in minutes"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {durationError && (
            <p className="mt-1.5 text-sm text-destructive">{durationError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Add Options</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => {
                setCandidateInput(e.target.value);
                setAddError(null);
              }}
              placeholder="Enter option name"
              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={handleAddCandidate}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition"
            >
              Add
            </button>
          </div>
          {addError && (
            <p className="mt-1.5 text-sm text-destructive">{addError}</p>
          )}
          {optionsError && (
            <p className="mt-1.5 text-sm text-destructive">{optionsError}</p>
          )}
        </div>

        {candidates.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Options ({candidates.length})
            </label>
            <div className="space-y-2">
              {candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border"
                >
                  <span className="text-sm">
                    {index + 1}. {candidate}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCandidate(index)}
                    className="text-xs text-destructive hover:text-destructive/80 font-medium transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSending ? "Creating..." : "Create Poll"}
        </button>
      </form>
    </div>
  );
}
