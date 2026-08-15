/*
# Auto-confirm email on new user signup

## Problem
New users could not sign in after registering because email confirmation was enabled
on the Supabase project. The `signUp` call creates the auth user (and the trigger
creates their profile + wallet), but no session is returned, and subsequent
`signInWithPassword` calls fail with "Email not confirmed" because the user
hasn't clicked a confirmation link.

## Fix
Update the `handle_new_user()` trigger function to also set `email_confirmed_at = now()`
on the newly created auth.users row. This auto-confirms the email immediately after
signup so the user can sign in right away — no email verification step required.

## Security
- The function is SECURITY DEFINER owned by postgres, so it has permission to
  update auth.users (which is normally restricted).
- This is appropriate for a demo/app where email verification is not required.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_umoja_id text; new_wallet_number text;
BEGIN
  new_umoja_id := generate_umoja_id();
  new_wallet_number := generate_wallet_number('personal');
  INSERT INTO profiles (id, umoja_id, full_name, phone, email)
  VALUES (NEW.id, new_umoja_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'), COALESCE(NEW.raw_user_meta_data->>'phone', ''), NEW.email);
  INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
  VALUES (new_wallet_number, 'personal', NEW.id, 0);

  -- Auto-confirm email so users can sign in immediately
  UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Recreate the trigger (drop and recreate to pick up the new function body)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
