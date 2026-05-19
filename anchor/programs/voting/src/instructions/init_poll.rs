use anchor_lang::prelude::*;

use crate::state::poll::Poll;

pub fn init_poll(
    ctx: Context<InitializePoll>,
    poll_id: u64,
    duration: u64,
    name: String,
    description: String,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    poll.authority = ctx.accounts.signer.key();

    poll.poll_id = poll_id;
    poll.description = description;
    poll.name = name;
    poll.duration = duration;
    poll.candidate_amount = 0;
    poll.active_candidates = 0;
    poll.started_at = None;
    Ok(())
}

#[derive(Accounts)]
#[instruction(poll_id:u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        space = 8 + Poll::INIT_SPACE,
        payer = signer,
        seeds = [b"poll".as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}
