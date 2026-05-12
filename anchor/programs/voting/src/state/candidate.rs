use anchor_lang::prelude::*;

#[derive(Debug, InitSpace, PartialEq, Eq)]
#[account]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
    pub id: u64,
}
