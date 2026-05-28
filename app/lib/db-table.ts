// src/lib/db/table-types.ts

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../utils/supabase/types";

export type PollRow = Omit<Tables<"polls">, "results"> & {
  results: PollResult | null
};

export type PollInsert = TablesInsert<"polls">;

export type PollUpdate = TablesUpdate<"polls">;

export type PollResult = {
  totalVotes: number;
  results: CandidateResult[];
};

export type CandidateResult = {
  candidateId: number;
  candidateName: string;
  votes: number;
};
