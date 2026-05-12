use anchor_lang::error_code;

#[error_code]
pub enum PollError {
    InvalidCandidateId,
    CannotInitCandidate,
    #[msg("Poll is not in draft")]
    PollNotDraft,
    #[msg("Poll is not active")]
    PollNotActive,
    #[msg("Poll has ended")]
    PollEnded,
}
