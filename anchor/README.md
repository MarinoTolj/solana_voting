## Deploying Your Own Program

To deploy your own version of the program:

### 1. Generate a new program keypair

```bash
cd anchor
solana-keygen new -o target/deploy/voting-keypair.json
```

### 2. Get the new program ID

```bash
solana address -k target/deploy/voting-keypair.json
```

### 3. Update the program ID

Update the program ID in these files:

- `anchor/Anchor.toml` - Update `voting = "..."` under `[programs.devnet]`
- `anchor/programs/voting/src/lib.rs` - Update `declare_id!("...")`

### 4. Build and deploy

```bash
# Build the program
anchor build

# Get devnet SOL for deployment (~2 SOL needed)
solana airdrop 2 --url devnet

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### 5. Regenerate the TypeScript client

```bash
cd ..
npm run codama:js
```

This updates the generated client code in `app/generated/voting/` with your new program ID.

## Program Overview

The voting program supports a full poll lifecycle:

- **Initialize poll**: Create a poll account with a title, description, duration, and draft state.
- **Add candidates**: Initialize candidate PDAs under the poll while it is still in draft.
- **Start poll**: Open voting once at least two candidates exist.
- **Vote**: Cast one vote per wallet for a candidate and record it with a voter-specific PDA.
- **End poll**: Optionally shorten the poll duration before the scheduled end time.
- **Close candidate / poll**: Close candidate accounts after voting ends and then close the poll account.

The app uses program-derived addresses for `poll`, `candidate`, and `vote` records to track state on-chain.

## Testing

Run the Anchor tests:

```bash
anchor test --skip-deploy
```
