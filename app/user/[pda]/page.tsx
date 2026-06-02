import { notFound } from "next/navigation";
import { isAddress } from "@solana/kit";
import fetchUserPollsFromDb from "@/app/utils/fetch-user-polls";
import PollList from "@/app/components/poll-list";

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

  const polls = await fetchUserPollsFromDb(pda);

  return <PollList polls={polls} scope="user" />;
}
