"use server;";

import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { PollInsert } from "../lib/db-table";

export async function insertPollAction(poll: PollInsert) {
  const supabase = createClient(await cookies());

  const { error } = await supabase.from("polls").insert(poll);

  if (error) {
    console.error(error);
    throw error;
  }
}
