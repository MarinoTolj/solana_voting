import { ClosedPoll } from "@/app/components/closed-poll";
import { PollCard } from "@/app/components/poll-card";
import FetchPoll from "@/app/utils/fetch-poll";
import { isAddress } from "@solana/kit";

type PollPageProps = {
  params: Promise<{
    pda: string;
  }>;
};

export default async function PollPage({ params }: PollPageProps) {
  const { pda } = await params;

  if (!isAddress(pda)) {
    return (
      <div className="px-6 py-8 text-center text-destructive">
        Invalid address: {pda}
      </div>
    );
  }

  const poll = await FetchPoll(pda);
  if (poll == null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 text-center text-destructive">
        Poll not found in database
      </div>
    );
  }

  if (poll.closed) {
    return <ClosedPoll poll={poll} />;
  }

  return <PollCard pollPda={pda} />;
}
