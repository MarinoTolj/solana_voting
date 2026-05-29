"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useInitPollForm } from "../hooks/use-init-poll-form";
import { buildPollInitInstructions } from "../lib/init-poll";
import { insertPollAction } from "../utils/insert-poll";
import { PollInsert } from "../lib/db-table";
import { parseTransactionError } from "../lib/errors";

export default function InitPoll() {
  const wallet = useWallet();
  const { send, isSending } = useSendTransaction();
  const router = useRouter();
  const {
    values,
    errors,
    setPollName,
    setPollDesc,
    setDuration,
    setCandidateInput,
    addCandidate,
    removeCandidate,
    validate,
  } = useInitPollForm();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInitPoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    if (!wallet.signer) {
      setSubmitError("Wallet is not connected.");
      toast.error("Wallet is not connected.");
      return;
    }

    try {
      const pollId = Date.now();
      const { pollPda, instructions } = await buildPollInitInstructions({
        signer: wallet.signer,
        pollId,
        values: {
          pollName: values.pollName.trim(),
          pollDesc: values.pollDesc.trim(),
          durationMinutes: Number(values.duration),
          candidates: values.candidates,
        },
      });

      await send({ instructions });

      const pollInsert: PollInsert = {
        created_by: wallet.signer.address,
        poll_id: pollId,
        pda: pollPda,
        name: values.pollName.trim(),
        description: values.pollDesc.trim(),
      };

      await insertPollAction(pollInsert);
      router.push(`/poll/${pollPda}`);
    } catch (error) {
      const message = parseTransactionError(error);
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <form onSubmit={handleInitPoll} className="space-y-6">
        {submitError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium mb-2">Poll Name</label>
          <input
            type="text"
            value={values.pollName}
            onChange={(event) => setPollName(event.target.value)}
            placeholder="Enter poll name"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {errors.pollName ? (
            <p className="mt-1.5 text-sm text-destructive">{errors.pollName}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Poll Description
          </label>
          <input
            type="text"
            value={values.pollDesc}
            onChange={(event) => setPollDesc(event.target.value)}
            placeholder="Enter poll description"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {errors.pollDesc ? (
            <p className="mt-1.5 text-sm text-destructive">{errors.pollDesc}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={values.duration}
            onChange={(event) => setDuration(event.target.value)}
            min={1}
            placeholder="Enter duration in minutes"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {errors.duration ? (
            <p className="mt-1.5 text-sm text-destructive">{errors.duration}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Add Options</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={values.candidateInput}
              onChange={(event) => setCandidateInput(event.target.value)}
              placeholder="Enter option name"
              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={addCandidate}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition"
            >
              Add
            </button>
          </div>
          {errors.candidateInput ? (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.candidateInput}
            </p>
          ) : null}
          {errors.options ? (
            <p className="mt-1.5 text-sm text-destructive">{errors.options}</p>
          ) : null}
        </div>

        {values.candidates.length > 0 ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Options ({values.candidates.length})
            </label>
            <div className="space-y-2">
              {values.candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border"
                >
                  <span className="text-sm">
                    {index + 1}. {candidate}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="text-xs text-destructive hover:text-destructive/80 font-medium transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
