#!/usr/bin/env bash

set -euo pipefail

#if [[ $# -ne 2 ]]; then
#  echo "Usage: $0 <PROGRAM_ID> <PROGRAM_SO>"
#  exit 1
#fi

PROGRAM_ID="EjwrYRuuUGazBKmhSAecnBPoDsb3U24Wrrom5fVZagis"
PROGRAM_SO="./target/deploy/voting.so"

echo "== Current deployed program info =="
solana program show "$PROGRAM_ID"

echo
echo "== Current deployed size =="
CURRENT_SIZE=$(solana program show "$PROGRAM_ID" \
  | grep -i "Data Length" \
  | awk '{print $3}')

if [[ -z "${CURRENT_SIZE:-}" ]]; then
  echo "Failed to determine current deployed size."
  exit 1
fi

echo "Current deployed size: $CURRENT_SIZE bytes"

echo
echo "== New program size =="
NEW_SIZE=$(wc -c < "$PROGRAM_SO" | tr -d ' ')

echo "New program size: $NEW_SIZE bytes"

if (( NEW_SIZE <= CURRENT_SIZE )); then
  echo
  echo "No resize needed."
  exit 0
fi

MORE_BYTES=$((NEW_SIZE - CURRENT_SIZE))

echo
echo "== Extending program account =="
echo "Need additional bytes: $MORE_BYTES"

solana program extend "$PROGRAM_ID" "$MORE_BYTES"

echo
echo "Program extended successfully."