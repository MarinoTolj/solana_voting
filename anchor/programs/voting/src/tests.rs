#[cfg(test)]
mod tests {
    use crate::{Candidate, Poll, ID as PROGRAM_ID};
    use anchor_lang::{prelude::system_program, AccountDeserialize};
    use litesvm::LiteSVM;
    use solana_sdk::{
        hash::hash,
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        transaction::Transaction,
    };

    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

    fn get_poll_pda(poll_id: u64) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[b"poll".as_ref(), poll_id.to_le_bytes().as_ref()],
            &PROGRAM_ID,
        )
    }
    fn get_candidate_pda(poll_id: u64, candidate_name: &String) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
            &PROGRAM_ID,
        )
    }

    fn create_poll_ix(
        signer: &Pubkey,
        poll: &Pubkey,
        poll_id: u64,
        poll_start: u64,
        poll_end: u64,
        name: String,
        description: String,
    ) -> Instruction {
        let discriminator = get_discriminator("initialize_poll");
        let mut data = discriminator.to_vec();
        data.extend_from_slice(&poll_id.to_le_bytes());
        data.extend_from_slice(&poll_start.to_le_bytes());
        data.extend_from_slice(&poll_end.to_le_bytes());
        data.extend_from_slice(&(name.len() as u32).to_le_bytes());
        data.extend_from_slice(&name.as_bytes());
        data.extend_from_slice(&(description.len() as u32).to_le_bytes());
        data.extend_from_slice(&description.as_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*signer, true),
                AccountMeta::new(*poll, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        }
    }

    fn create_candidate_ix(
        signer: &Pubkey,
        poll: &Pubkey,
        candidate: &Pubkey,
        poll_id: u64,
        candidate_name: String,
    ) -> Instruction {
        let discriminator = get_discriminator("initialize_candidate");
        let mut data = discriminator.to_vec();
        data.extend_from_slice(&(candidate_name.len() as u32).to_le_bytes());
        data.extend_from_slice(&candidate_name.as_bytes());
        data.extend_from_slice(&poll_id.to_le_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*signer, true),
                AccountMeta::new(*poll, false),
                AccountMeta::new(*candidate, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        }
    }

    fn create_vote_ix(
        signer: &Pubkey,
        poll: &Pubkey,
        candidate: &Pubkey,
        poll_id: u64,
        candidate_name: String,
    ) -> Instruction {
        let discriminator = get_discriminator("vote");
        let mut data = discriminator.to_vec();
        data.extend_from_slice(&(candidate_name.len() as u32).to_le_bytes());
        data.extend_from_slice(&candidate_name.as_bytes());
        data.extend_from_slice(&poll_id.to_le_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*signer, true),
                AccountMeta::new(*poll, false),
                AccountMeta::new(*candidate, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        }
    }

    fn get_discriminator(name: &str) -> [u8; 8] {
        let preimage = format!("global:{}", name);
        let hash = hash(preimage.as_bytes());
        let mut disc = [0u8; 8];
        disc.copy_from_slice(&hash.to_bytes()[..8]);
        disc
    }

    #[test]
    fn test_init_poll() {
        let mut svm = LiteSVM::new();

        // Load the program
        let program_bytes = include_bytes!("../../../target/deploy/voting.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        // Create a user with some SOL
        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let poll_id = 0;
        let (poll_pda, _bump) = get_poll_pda(0);

        let init_poll = &Poll {
            poll_id,
            name: "Test name".to_string(),
            description: "Test desc".to_string(),
            poll_start: 0,
            poll_end: 1,
            candidate_amount: 0,
        };
        let init_poll_ix = create_poll_ix(
            &user.pubkey(),
            &poll_pda,
            poll_id,
            init_poll.poll_start,
            init_poll.poll_end,
            init_poll.name.clone(),
            init_poll.description.clone(),
        );

        let blockhash = svm.latest_blockhash();
        let init_poll_tx = Transaction::new_signed_with_payer(
            &[init_poll_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(init_poll_tx);
        assert!(result.is_ok(), "Init poll should succeed");
        let account = svm.get_account(&poll_pda).unwrap();
        let mut data: &[u8] = &account.data;

        let poll = Poll::try_deserialize(&mut data).unwrap();

        assert_eq!(*init_poll, poll);
    }
    #[test]
    fn test_init_candidate() {
        let mut svm = LiteSVM::new();

        // Load the program
        let program_bytes = include_bytes!("../../../target/deploy/voting.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        // Create a user with some SOL
        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let poll_id = 0;
        let (poll_pda, _bump) = get_poll_pda(0);
        let candidate_name1 = "Test candidate 1";
        let (candidate_pda1, _bump) = get_candidate_pda(0, &candidate_name1.to_string());

        let candidate_name2 = "Test candidate 2";
        let (candidate_pda2, _bump) = get_candidate_pda(0, &candidate_name2.to_string());

        let init_poll = &Poll {
            poll_id,
            name: "Test name".to_string(),
            description: "Test desc".to_string(),
            poll_start: 0,
            poll_end: 1,
            candidate_amount: 2,
        };
        let init_poll_ix = create_poll_ix(
            &user.pubkey(),
            &poll_pda,
            poll_id,
            init_poll.poll_start,
            init_poll.poll_end,
            init_poll.name.clone(),
            init_poll.description.clone(),
        );

        let candidate1 = Candidate {
            candidate_name: candidate_name1.to_string(),
            candidate_votes: 0,
        };
        let candidate2 = Candidate {
            candidate_name: candidate_name2.to_string(),
            candidate_votes: 0,
        };

        let init_candidate1_ix = create_candidate_ix(
            &user.pubkey(),
            &poll_pda,
            &candidate_pda1,
            poll_id,
            candidate_name1.to_string(),
        );
        let init_candidate2_ix = create_candidate_ix(
            &user.pubkey(),
            &poll_pda,
            &candidate_pda2,
            poll_id,
            candidate_name2.to_string(),
        );

        let blockhash = svm.latest_blockhash();
        let init_poll_tx = Transaction::new_signed_with_payer(
            &[init_poll_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let init_candidate1_tx = Transaction::new_signed_with_payer(
            &[init_candidate1_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let init_candidate2_tx = Transaction::new_signed_with_payer(
            &[init_candidate2_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(init_poll_tx);
        assert!(result.is_ok(), "Init poll should succeed");

        let result = svm.send_transaction(init_candidate1_tx);
        assert!(result.is_ok(), "Init candidate 1 should succeed");

        let result = svm.send_transaction(init_candidate2_tx);

        assert!(result.is_ok(), "Init candidate 2 should succeed");

        let account = svm.get_account(&poll_pda).unwrap();
        let mut data: &[u8] = &account.data;

        let poll = Poll::try_deserialize(&mut data).unwrap();
        assert_eq!(*init_poll, poll);

        let cand1_account = svm.get_account(&candidate_pda1).unwrap();
        let mut data: &[u8] = &cand1_account.data;

        let candidate = Candidate::try_deserialize(&mut data).unwrap();
        assert_eq!(candidate1, candidate);

        let cand2_account = svm.get_account(&candidate_pda2).unwrap();
        let mut data: &[u8] = &cand2_account.data;

        let candidate = Candidate::try_deserialize(&mut data).unwrap();
        assert_eq!(candidate2, candidate);
    }

    #[test]
    fn test_vote() {
        let mut svm = LiteSVM::new();

        // Load the program
        let program_bytes = include_bytes!("../../../target/deploy/voting.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        // Create a user with some SOL
        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let poll_id = 0;
        let (poll_pda, _bump) = get_poll_pda(0);
        let candidate_name1 = "Test candidate 1";
        let (candidate_pda1, _bump) = get_candidate_pda(0, &candidate_name1.to_string());

        let candidate_name2 = "Test candidate 2";
        let (candidate_pda2, _bump) = get_candidate_pda(0, &candidate_name2.to_string());

        let init_poll = &Poll {
            poll_id,
            name: "Test name".to_string(),
            description: "Test desc".to_string(),
            poll_start: 0,
            poll_end: 1,
            candidate_amount: 2,
        };
        let init_poll_ix = create_poll_ix(
            &user.pubkey(),
            &poll_pda,
            poll_id,
            init_poll.poll_start,
            init_poll.poll_end,
            init_poll.name.clone(),
            init_poll.description.clone(),
        );

        let candidate1 = Candidate {
            candidate_name: candidate_name1.to_string(),
            candidate_votes: 0,
        };
        let candidate2 = Candidate {
            candidate_name: candidate_name2.to_string(),
            candidate_votes: 0,
        };

        let init_candidate1_ix = create_candidate_ix(
            &user.pubkey(),
            &poll_pda,
            &candidate_pda1,
            poll_id,
            candidate_name1.to_string(),
        );
        let init_candidate2_ix = create_candidate_ix(
            &user.pubkey(),
            &poll_pda,
            &candidate_pda2,
            poll_id,
            candidate_name2.to_string(),
        );

        let init_candidate1_vote_ix = create_vote_ix(
            &user.pubkey(),
            &poll_pda,
            &candidate_pda1,
            poll_id,
            candidate_name1.to_string(),
        );

        let init_candidate2_vote_ix = create_vote_ix(
            &user.pubkey(),
            &poll_pda,
            &candidate_pda2,
            poll_id,
            candidate_name2.to_string(),
        );

        let blockhash = svm.latest_blockhash();
        let init_poll_tx = Transaction::new_signed_with_payer(
            &[init_poll_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let init_candidate1_tx = Transaction::new_signed_with_payer(
            &[init_candidate1_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let init_candidate2_tx = Transaction::new_signed_with_payer(
            &[init_candidate2_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let init_candidate1_vote_tx = Transaction::new_signed_with_payer(
            &[init_candidate1_vote_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let init_candidate2_vote_tx = Transaction::new_signed_with_payer(
            &[init_candidate2_vote_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(init_poll_tx);
        assert!(result.is_ok(), "Init poll should succeed");

        let result = svm.send_transaction(init_candidate1_tx);
        assert!(result.is_ok(), "Init candidate 1 should succeed");

        let result = svm.send_transaction(init_candidate2_tx);
        assert!(result.is_ok(), "Init candidate 2 should succeed");

        let result = svm.send_transaction(init_candidate1_vote_tx);
        assert!(result.is_ok(), "Vote candidate 1 should succeed");

        let result = svm.send_transaction(init_candidate2_vote_tx);
        assert!(result.is_ok(), "Vote candidate 2 should succeed");

        let account = svm.get_account(&poll_pda).unwrap();
        let mut data: &[u8] = &account.data;

        let poll = Poll::try_deserialize(&mut data).unwrap();

        assert_eq!(*init_poll, poll);

        let cand1_account = svm.get_account(&candidate_pda1).unwrap();
        let mut data: &[u8] = &cand1_account.data;

        let candidate = Candidate::try_deserialize(&mut data).unwrap();
        assert_eq!(candidate1.candidate_votes + 1, candidate.candidate_votes);

        let cand2_account = svm.get_account(&candidate_pda2).unwrap();
        let mut data: &[u8] = &cand2_account.data;

        let candidate = Candidate::try_deserialize(&mut data).unwrap();
        assert_eq!(candidate2.candidate_votes + 1, candidate.candidate_votes);
    }
}
