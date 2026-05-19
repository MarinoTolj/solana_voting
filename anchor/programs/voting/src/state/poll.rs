use anchor_lang::prelude::*;

#[derive(Debug, InitSpace, PartialEq, Eq)]
#[account]
pub struct Poll {
    pub authority: Pubkey,

    pub poll_id: u64,
    #[max_len(16)]
    pub name: String,
    #[max_len(32)]
    pub description: String,
    pub started_at: Option<i64>,
    ///In seconds
    pub duration: u64,
    pub candidate_amount: u8,
    ///Number of unclosed candidates. Can not close poll if all candidates accounts are still active.
    pub active_candidates: u8,
}
