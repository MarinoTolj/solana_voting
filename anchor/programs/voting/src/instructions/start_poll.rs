use anchor_lang::prelude::*;

use crate::{error::PollError, state::poll::Poll};

pub fn start(ctx: Context<StartPoll>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;

    require!(poll.started_at.is_none(), PollError::PollNotDraft);
    require!(poll.candidate_amount > 1, PollError::CannotStartPoll);
    
    poll.started_at = Some(Clock::get()?.unix_timestamp);

    Ok(())
}

#[derive(Accounts)]
#[instruction(poll_id:u64)]
pub struct StartPoll<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"poll".as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
}
