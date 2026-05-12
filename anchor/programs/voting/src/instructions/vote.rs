use anchor_lang::prelude::*;

use crate::{
    error::PollError,
    state::{candidate::Candidate, poll::Poll},
};

pub fn vote(ctx: Context<Vote>) -> Result<()> {
    let poll = &ctx.accounts.poll;

    require!(poll.started_at.is_some(), PollError::PollNotActive);

    let now = Clock::get()?.unix_timestamp;

    let end_time = poll.started_at.unwrap() + poll.duration as i64;

    require!(now < end_time, PollError::PollEnded);

    let candidate = &mut ctx.accounts.candidate;
    candidate.candidate_votes += 1;
    Ok(())
}

#[derive(Accounts)]
#[instruction(candidate_id:u64,poll_id:u64)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,
    #[account(
        seeds = [b"poll".as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        mut,
        seeds = [b"candidate", poll_id.to_le_bytes().as_ref(), candidate_id.to_le_bytes().as_ref()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
}
