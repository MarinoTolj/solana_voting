use anchor_lang::prelude::*;

use crate::{
    error::PollError,
    state::{candidate::Candidate, poll::Poll},
};

pub fn close_candidate(ctx: Context<CloseCandidate>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let candidate = &ctx.accounts.candidate;

    if poll.started_at.is_some() {
        let now = Clock::get()?.unix_timestamp;
        let end_time = poll.started_at.unwrap() + poll.duration as i64;

        require!(now > end_time, PollError::CannotCloseCandidate);
    }

    require!(
        candidate.poll == poll.key(),
        PollError::CannotCloseCandidate
    );

    poll.active_candidates = poll
        .active_candidates
        .checked_sub(1)
        .ok_or(PollError::InvalidCandidateAmount)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(candidate_id:u8, poll_id:u64)]
pub struct CloseCandidate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        close = authority,
        seeds = [
            b"candidate",
            poll.key().as_ref(),
            candidate_id.to_le_bytes().as_ref()
        ],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,
}
