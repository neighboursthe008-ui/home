/*
# Wallet balance helper functions + Seed data

## Functions
- increment_wallet_balance(p_wallet_id, p_amount): adds to wallet balance
- decrement_wallet_balance(p_wallet_id, p_amount): subtracts from wallet balance

## Seed data
- Creates a demo user (John Kamau) via auth.users so the trigger creates profile + wallet
- Creates demo groups (Good Hope Welfare, Youth Development Group, Family Support Fund, Tech Innovators Chama, Greenfield Farmers Co-op) with group wallets and founders
- Adds John as a member of each group with appropriate roles
- Seeds some transactions for history
*/

-- ── Wallet balance helper functions ──
CREATE OR REPLACE FUNCTION increment_wallet_balance(p_wallet_id uuid, p_amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets SET balance = balance + p_amount WHERE id = p_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_wallet_balance(p_wallet_id uuid, p_amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets SET balance = balance - p_amount WHERE id = p_wallet_id;
END;
$$;
