use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub poll: Pubkey,
    pub candidate: Pubkey,
}
