import { PollCard } from "@/app/components/poll-card";
import { isAddress } from "@solana/kit";

type PollPageProps = {
  params: Promise<{
    pda: string;
  }>;
};

export default async function PollPage({
  params,
}: PollPageProps) {
  const { pda } = await params;

  if (!isAddress(pda)){
    return <div className="px-6 py-8 text-center text-destructive">Invalid address: {pda}</div>
  }

  return (
    <PollCard pollPda={pda}/>
  );
}