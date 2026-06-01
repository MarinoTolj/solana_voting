import { notFound } from "next/navigation";
import { isAddress } from "@solana/kit";

import { ClosedPoll } from "@/app/components/closed-poll";
import { PollCard } from "@/app/components/poll-card";
import fetchPollFromDb from "@/app/utils/fetch-poll";

type PollPageProps = {
  params: Promise<{
    pda: string;
  }>;
};

export default async function PollPage({ params }: PollPageProps) {
  const { pda } = await params;

  if (!isAddress(pda)) {
    notFound();
  }

  let poll;

  try {
    poll = await fetchPollFromDb(pda);
  } catch (error) {
    console.error("Failed to fetch poll:", error);
    notFound();
  }

  if (!poll) {
    notFound();
  }

  if (poll.closed) {
    return <ClosedPoll poll={poll} />;
  }

  return <PollCard pollPda={pda} />;
}
