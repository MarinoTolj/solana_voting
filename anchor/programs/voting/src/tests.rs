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

    struct TestContext {
        svm: LiteSVM,
        user: Keypair,
    }

    impl TestContext {
        fn new() -> Self {
            let mut svm = LiteSVM::new();

            let program_bytes = include_bytes!("../../../target/deploy/voting.so");
            svm.add_program(PROGRAM_ID, program_bytes);

            let user = Keypair::new();
            svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

            Self { svm, user }
        }

        fn send_ix(&mut self, ix: Instruction) {
            let tx = Transaction::new_signed_with_payer(
                &[ix],
                Some(&self.user.pubkey()),
                &[&self.user],
                self.svm.latest_blockhash(),
            );

            let res = self.svm.send_transaction(tx);
            assert!(res.is_ok());
        }

        fn get_account<T: AccountDeserialize>(&self, pubkey: &Pubkey) -> T {
            let acc = self.svm.get_account(pubkey).unwrap();
            let mut data: &[u8] = &acc.data;
            T::try_deserialize(&mut data).unwrap()
        }
    }

    fn get_poll_pda(poll_id: u64) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"poll", &poll_id.to_le_bytes()], &PROGRAM_ID)
    }

    fn get_candidate_pda(poll_id: u64, candidate_id: u64) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[
                b"candidate",
                poll_id.to_le_bytes().as_ref(),
                candidate_id.to_le_bytes().as_ref(),
            ],
            &PROGRAM_ID,
        )
    }

    fn get_discriminator(name: &str) -> [u8; 8] {
        let preimage = format!("global:{}", name);
        let hash = hash(preimage.as_bytes());
        let mut disc = [0u8; 8];
        disc.copy_from_slice(&hash.to_bytes()[..8]);
        disc
    }

    fn write_string(data: &mut Vec<u8>, s: &str) {
        data.extend_from_slice(&(s.len() as u32).to_le_bytes());
        data.extend_from_slice(s.as_bytes());
    }

    fn create_poll_ix(
        signer: &Pubkey,
        poll: &Pubkey,
        poll_id: u64,
        poll_start: u64,
        poll_end: u64,
        name: &str,
        description: &str,
    ) -> Instruction {
        let mut data = get_discriminator("initialize_poll").to_vec();

        data.extend_from_slice(&poll_id.to_le_bytes());
        data.extend_from_slice(&poll_start.to_le_bytes());
        data.extend_from_slice(&poll_end.to_le_bytes());
        write_string(&mut data, name);
        write_string(&mut data, description);

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
        ix_name: &str,
        signer: &Pubkey,
        poll: &Pubkey,
        candidate: &Pubkey,
        candidate_id: u64,
        poll_id: u64,
        name: &str,
    ) -> Instruction {
        let mut data = get_discriminator(ix_name).to_vec();

        data.extend_from_slice(&candidate_id.to_le_bytes());
        data.extend_from_slice(&poll_id.to_le_bytes());
        write_string(&mut data, name);

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

    fn vote_ix(
        ix_name: &str,
        signer: &Pubkey,
        poll: &Pubkey,
        candidate: &Pubkey,
        candidate_id: u64,
        poll_id: u64,
    ) -> Instruction {
        let mut data = get_discriminator(ix_name).to_vec();

        data.extend_from_slice(&candidate_id.to_le_bytes());
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

    #[test]
    fn test_init_poll() {
        let mut ctx = TestContext::new();

        let poll_id = 0;
        let (poll_pda, _) = get_poll_pda(poll_id);

        let expected = Poll {
            poll_id,
            name: "Test name".into(),
            description: "Test desc".into(),
            poll_start: 0,
            poll_end: 1,
            candidate_amount: 0,
        };

        ctx.send_ix(create_poll_ix(
            &ctx.user.pubkey(),
            &poll_pda,
            poll_id,
            expected.poll_start,
            expected.poll_end,
            &expected.name,
            &expected.description,
        ));

        let poll: Poll = ctx.get_account(&poll_pda);
        assert_eq!(expected, poll);
    }

    #[test]
    fn test_init_candidate() {
        let mut ctx = TestContext::new();

        let poll_id = 0;
        let (poll_pda, _) = get_poll_pda(poll_id);

        ctx.send_ix(create_poll_ix(
            &ctx.user.pubkey(),
            &poll_pda,
            poll_id,
            0,
            1,
            "Test",
            "Desc",
        ));

        let name1 = "Candidate 1";
        let id1 = 0;
        let name2 = "Candidate 2";
        let id2 = 1;

        let (c1_pda, _) = get_candidate_pda(poll_id, id1);
        let (c2_pda, _) = get_candidate_pda(poll_id, id2);

        ctx.send_ix(create_candidate_ix(
            "initialize_candidate",
            &ctx.user.pubkey(),
            &poll_pda,
            &c1_pda,
            id1,
            poll_id,
            name1,
        ));

        ctx.send_ix(create_candidate_ix(
            "initialize_candidate",
            &ctx.user.pubkey(),
            &poll_pda,
            &c2_pda,
            id2,
            poll_id,
            name2,
        ));

        let c1: Candidate = ctx.get_account(&c1_pda);
        let c2: Candidate = ctx.get_account(&c2_pda);

        assert_eq!(c1.candidate_votes, 0);
        assert_eq!(c2.candidate_votes, 0);
    }

    #[test]
    fn test_vote() {
        let mut ctx = TestContext::new();

        let poll_id = 0;
        let (poll_pda, _) = get_poll_pda(poll_id);

        let name1 = "Candidate 1";
        let id1 = 0;
        let name2 = "Candidate 2";
        let id2 = 1;

        let (c1_pda, _) = get_candidate_pda(poll_id, id1);
        let (c2_pda, _) = get_candidate_pda(poll_id, id2);

        ctx.send_ix(create_poll_ix(
            &ctx.user.pubkey(),
            &poll_pda,
            poll_id,
            0,
            1,
            "Test",
            "Desc",
        ));

        for (name, id) in [(name1, id1), (name2, id2)] {
            let (pda, _) = get_candidate_pda(poll_id, id);

            ctx.send_ix(create_candidate_ix(
                "initialize_candidate",
                &ctx.user.pubkey(),
                &poll_pda,
                &pda,
                id,
                poll_id,
                name,
            ));

            ctx.send_ix(vote_ix(
                "vote",
                &ctx.user.pubkey(),
                &poll_pda,
                &pda,
                id,
                poll_id,
            ));
        }

        let c1: Candidate = ctx.get_account(&c1_pda);
        let c2: Candidate = ctx.get_account(&c2_pda);

        assert_eq!(c1.candidate_votes, 1);
        assert_eq!(c2.candidate_votes, 1);
    }
}
