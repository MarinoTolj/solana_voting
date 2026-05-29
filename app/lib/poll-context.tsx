"use client";

import { createContext, useContext, ReactNode } from "react";
import { Address } from "@solana/kit";
import { Poll } from "../generated/voting";
import { PollStatus } from "../hooks/use-poll-timer";

interface PollContextType {
  poll: Poll | null;
  pollPda: Address<string>;
  status: PollStatus;
  remaining: number;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export function PollProvider({
  children,
  poll,
  pollPda,
  status,
  remaining,
}: PollContextType & { children: ReactNode }) {
  return (
    <PollContext.Provider value={{ poll, pollPda, status, remaining }}>
      {children}
    </PollContext.Provider>
  );
}

export function usePollContext() {
  const context = useContext(PollContext);
  if (context === undefined) {
    throw new Error("usePollContext must be used within a PollProvider");
  }
  return context;
}
