#[cfg(test)]
mod tests {
    use crate::{Poll, ID as PROGRAM_ID};
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
}
