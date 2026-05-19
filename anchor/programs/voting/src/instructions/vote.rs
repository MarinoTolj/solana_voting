use anchor_lang::prelude::*;

use crate::{
    error::PollError,
    state::{candidate::Candidate, poll::Poll, vote_record::VoteRecord},
};

pub fn vote(ctx: Context<Vote>) -> Result<()> {
    let poll = &ctx.accounts.poll;

    require!(poll.started_at.is_some(), PollError::PollNotActive);

    let now = Clock::get()?.unix_timestamp;
    let end_time = poll.started_at.unwrap() + poll.duration as i64;

    require!(now < end_time, PollError::PollEnded);

    let candidate = &mut ctx.accounts.candidate;
    candidate.candidate_votes += 1;

    let vote_record = &mut ctx.accounts.vote_record;
    vote_record.voter = ctx.accounts.signer.key();
    vote_record.poll = poll.key();
    vote_record.candidate = candidate.key();

    Ok(())
}

#[derive(Accounts)]
#[instruction(candidate_id:u8,poll_id:u64)]
pub struct Vote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [
            b"candidate",
            poll.key().as_ref(),
            candidate_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(
        init,
        payer = signer,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [
            b"vote",
            poll.key().as_ref(),
            signer.key().as_ref()
        ],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}
