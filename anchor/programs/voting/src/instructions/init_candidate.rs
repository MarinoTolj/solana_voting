use anchor_lang::prelude::*;

use crate::{
    error::PollError,
    state::{candidate::Candidate, poll::Poll},
};

pub fn init_candidate(
    ctx: Context<InitializeCandidate>,
    candidate_id: u64,
    candidate_name: String,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;

    require!(
        candidate_id == poll.candidate_amount,
        PollError::InvalidCandidateId
    );
    require!(poll.started_at.is_none(), PollError::CannotInitCandidate);

    let candidate = &mut ctx.accounts.candidate;

    candidate.id = candidate_id;
    candidate.candidate_name = candidate_name;
    candidate.candidate_votes = 0;

    poll.candidate_amount += 1;

    Ok(())
}

#[derive(Accounts)]
#[instruction(candidate_id:u64, poll_id:u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"poll".as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        space = 8 + Candidate::INIT_SPACE,
        payer = signer,
        seeds = [b"candidate", poll_id.to_le_bytes().as_ref(), candidate_id.to_le_bytes().as_ref()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
    pub system_program: Program<'info, System>,
}
