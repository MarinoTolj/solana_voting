#![allow(warnings)]
use anchor_lang::prelude::*;

#[cfg(test)]
mod tests;

declare_id!("EjwrYRuuUGazBKmhSAecnBPoDsb3U24Wrrom5fVZagis");

pub mod error;
mod instructions;
mod state;

use error::*;
use instructions::*;
use state::*;

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        duration: u64,
        name: String,
        description: String,
    ) -> Result<()> {
        instructions::init_poll(ctx, poll_id, duration, name, description)
    }
    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        candidate_id: u8,
        _poll_id: u64,
        candidate_name: String,
    ) -> Result<()> {
        instructions::init_candidate(ctx, candidate_id, candidate_name)
    }

    pub fn start_poll(ctx: Context<StartPoll>, _poll_id: u64) -> Result<()> {
        instructions::start(ctx)
    }

    pub fn vote_candidate(ctx: Context<Vote>, _candidate_id: u8, _poll_id: u64) -> Result<()> {
        instructions::vote(ctx)
    }

    pub fn close_candidate(
        ctx: Context<CloseCandidate>,
        _candidate_id: u8,
        _poll_id: u64,
    ) -> Result<()> {
        instructions::close_candidate(ctx)
    }
    pub fn close_poll(ctx: Context<ClosePoll>, _poll_id: u64) -> Result<()> {
        instructions::close_poll(ctx)
    }
    pub fn end_poll(ctx: Context<EndPoll>, _poll_id: u64) -> Result<()> {
        instructions::end_poll(ctx)
    }
}
