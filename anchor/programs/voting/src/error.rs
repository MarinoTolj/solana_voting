use anchor_lang::error_code;

#[error_code]
pub enum PollError {
    InvalidCandidateId,
    CannotInitCandidate,
    #[msg("Can not close candidate during active poll")]
    CannotCloseCandidate,
    #[msg("Can not close poll during active poll")]
    CannotClosePoll,
    #[msg("Can not close poll with active canidates")]
    ActiveCanidates,
    #[msg("Tried to close more candidates than there is in poll")]
    InvalidCandidateAmount,
    #[msg("Poll is not in draft")]
    PollNotDraft,
    #[msg("Poll is not active")]
    PollNotActive,
    #[msg("Poll has ended")]
    PollEnded,
}
