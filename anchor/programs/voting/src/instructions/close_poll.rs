use anchor_lang::prelude::*;

use crate::{
    error::PollError,
    state::{candidate::Candidate, poll::Poll},
};

pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;

    if poll.started_at.is_some() {
        let now = Clock::get()?.unix_timestamp;
        let end_time = poll.started_at.unwrap() + poll.duration as i64;

        require!(now > end_time, PollError::CannotClosePoll);
    }

    require!(poll.active_candidates.eq(&0), PollError::ActiveCanidates);

    Ok(())
}

#[derive(Accounts)]
#[instruction(poll_id:u64)]
pub struct ClosePoll<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,
}
