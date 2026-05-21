use anchor_lang::prelude::*;

use crate::{error::PollError, state::poll::Poll};

pub fn end_poll(ctx: Context<EndPoll>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;

    match poll.started_at {
        Some(start_time) => {
            let now = Clock::get()?.unix_timestamp;
            let elapsed = now
                .checked_sub(start_time)
                .ok_or(PollError::CannotEndPoll)? as u64;

            require!(elapsed < poll.duration, PollError::CannotEndPoll);

            poll.duration = elapsed;
        }
        None => return Err(error!(PollError::CannotEndPoll)),
    };

    Ok(())
}

#[derive(Accounts)]
#[instruction(poll_id:u64)]
pub struct EndPoll<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,
}
