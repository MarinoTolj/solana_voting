import { PollCard } from "@/app/components/poll-card";

type PollPageProps = {
  params: Promise<{
    pda: string;
  }>;
};

export default async function PollPage({
  params,
}: PollPageProps) {
  const { pda } = await params;

  return (
    <PollCard pda={pda}/>
  );
}