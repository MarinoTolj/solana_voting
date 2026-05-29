import type { Instruction, TransactionSigner } from "@solana/kit";
import {
  findPollPda,
  getInitializeCandidateInstructionAsync,
  getInitializePollInstructionAsync,
} from "../generated/voting/";

export type PollInitValues = {
  pollName: string;
  pollDesc: string;
  durationMinutes: number;
  candidates: string[];
};

export async function buildPollInitInstructions({
  signer,
  values,
  pollId,
}: {
  signer: TransactionSigner;
  values: PollInitValues;
  pollId: number;
}): Promise<{
  pollPda: string;
  instructions: Instruction[];
}> {
  const [pollPda] = await findPollPda({ pollId });

  const instructions: Instruction[] = [];

  const createPollInstruction = await getInitializePollInstructionAsync({
    signer,
    pollId,
    description: values.pollDesc,
    name: values.pollName,
    poll: pollPda,
    duration: values.durationMinutes * 60,
  });

  instructions.push(createPollInstruction);

  for (
    let candidateId = 0;
    candidateId < values.candidates.length;
    candidateId += 1
  ) {
    const candidateInstruction = await getInitializeCandidateInstructionAsync({
      signer,
      pollId,
      candidateName: values.candidates[candidateId],
      candidateId,
    });
    instructions.push(candidateInstruction);
  }

  return { pollPda, instructions };
}
