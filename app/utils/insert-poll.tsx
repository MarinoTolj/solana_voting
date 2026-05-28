import { createClient } from "./supabase/client";
import { PollInsert } from "../lib/db-table";

export default async function InsertPoll(poll:PollInsert){
    const supabase = createClient();

    const { error } = await supabase
      .from("polls")
      .insert(poll);

    if (error) {
      console.error(error);
      throw error;
    }
}