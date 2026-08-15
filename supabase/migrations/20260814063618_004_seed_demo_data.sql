/*
# Seed demo data: John Kamau + groups + transactions

Creates a complete demo dataset for the UMOJA platform:
- John Kamau (demo user with known credentials)
- 5 groups with founders, wallets, and members
- Sample transactions
- Notifications

Login: john.kamau@umoja.app / umoja12345
*/

-- ── Create demo auth user ──
-- We insert directly into auth.users, which triggers handle_new_user to create profile + wallet
-- Then we update the profile and wallet with specific values

DO $$
DECLARE
  john_id uuid;
  wallet_id uuid;
  grp1_id uuid;
  grp2_id uuid;
  grp3_id uuid;
  grp4_id uuid;
  grp5_id uuid;
  grp1_wallet uuid;
  grp2_wallet uuid;
  grp3_wallet uuid;
  grp4_wallet uuid;
  grp5_wallet uuid;
BEGIN
  -- Check if John already exists
  SELECT id INTO john_id FROM auth.users WHERE email = 'john.kamau@umoja.app';
  
  IF john_id IS NULL THEN
    -- Create auth user with known password
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token,
      recovery_token, email_change_token_new, email_change, last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'john.kamau@umoja.app',
      crypt('umoja12345', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"John Kamau","phone":"+254 712 345 678"}',
      '',
      '',
      '',
      '',
      now()
    )
    RETURNING id INTO john_id;

    -- The trigger should have created profile + wallet, but let's ensure
    -- Update profile with proper data
    UPDATE profiles 
    SET 
      umoja_id = 'UMJ-00001842',
      full_name = 'John Kamau',
      phone = '+254 712 345 678',
      avatar_color = 'bg-brand-500',
      phone_verified = true,
      total_contributed = 84500,
      contribution_count = 27,
      last_contribution_at = '2026-08-14T07:45:00+00:00',
      groups_joined = 5
    WHERE id = john_id;

    -- Update personal wallet with specific number and balance
    UPDATE wallets
    SET wallet_number = '100482736501', balance = 25000
    WHERE owner_type = 'personal' AND owner_id = john_id;

    -- Set a PIN (hash of "1234")
    UPDATE profiles SET pin_hash = encode(digest('umoja-pin:1234:' || john_id::text, 'sha256'), 'hex'), pin_set_at = now()
    WHERE id = john_id;

    -- ── Create Group 1: Good Hope Welfare ──
    INSERT INTO groups (id, group_id, name, description, category, purpose, location, logo_color, status, total_contributions, contributor_count, registered_members, non_registered_contributors, contributions_this_month, transaction_count, created_at, created_by)
    VALUES (gen_random_uuid(), 'GRP-000421', 'Good Hope Welfare', 'Community welfare group supporting members during times of need — medical bills, funerals, and emergencies.', 'Welfare', 'Emergency support & mutual aid', 'Nairobi, Kenya', 'bg-brand-500', 'active', 2450000, 1245, 830, 415, 385000, 8492, '2024-01-20T10:00:00+00:00', john_id)
    RETURNING id INTO grp1_id;

    -- Group 1 wallet
    INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
    VALUES ('200839274610', 'group', grp1_id, 1850000);
    
    -- Group 1 founders
    INSERT INTO group_founders (group_id, profile_id, full_name, national_id, phone, otp_verified, otp_sent) VALUES
    (grp1_id, NULL, 'Grace Wanjiru', '29384756', '+254 722 111 128', true, true),
    (grp1_id, NULL, 'Peter Mwangi', '28475639', '+254 722 222 234', true, true),
    (grp1_id, NULL, 'Esther Njoki', '27654830', '+254 722 333 345', true, true);

    -- John as group_admin of Group 1
    INSERT INTO group_members (group_id, profile_id, role, status, total_contributed, joined_at) VALUES
    (grp1_id, john_id, 'group_admin', 'active', 32500, '2024-01-20T10:00:00+00:00');

    -- ── Create Group 2: Youth Development Group ──
    INSERT INTO groups (id, group_id, name, description, category, purpose, location, logo_color, status, total_contributions, contributor_count, registered_members, non_registered_contributors, contributions_this_month, transaction_count, created_at, created_by)
    VALUES (gen_random_uuid(), 'GRP-000438', 'Youth Development Group', 'Empowering young people through skills training, mentorship, and collective savings.', 'Development', 'Youth empowerment & education', 'Kiambu, Kenya', 'bg-secondary-500', 'active', 92800, 184, 142, 42, 18700, 612, '2024-05-12T14:30:00+00:00', john_id)
    RETURNING id INTO grp2_id;

    INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
    VALUES ('200839274611', 'group', grp2_id, 65000);

    INSERT INTO group_founders (group_id, profile_id, full_name, national_id, phone, otp_verified, otp_sent) VALUES
    (grp2_id, NULL, 'Brian Otieno', '39284756', '+254 722 444 567', true, true),
    (grp2_id, NULL, 'Alice Akinyi', '38475629', '+254 722 555 678', true, true),
    (grp2_id, NULL, 'Kevin Ochieng', '37654820', '+254 722 666 789', true, true);

    INSERT INTO group_members (group_id, profile_id, role, status, total_contributed, joined_at) VALUES
    (grp2_id, john_id, 'treasurer', 'active', 18000, '2024-05-12T14:30:00+00:00');

    -- ── Create Group 3: Family Support Fund ──
    INSERT INTO groups (id, group_id, name, description, category, purpose, location, logo_color, status, total_contributions, contributor_count, registered_members, non_registered_contributors, contributions_this_month, transaction_count, created_at, created_by)
    VALUES (gen_random_uuid(), 'GRP-000451', 'Family Support Fund', 'Supporting families with education fees, healthcare, and livelihood projects.', 'Family Support', 'Family welfare & education', 'Nakuru, Kenya', 'bg-accent-500', 'active', 341200, 387, 298, 89, 52400, 2103, '2024-08-03T09:15:00+00:00', john_id)
    RETURNING id INTO grp3_id;

    INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
    VALUES ('200839274612', 'group', grp3_id, 280000);

    INSERT INTO group_founders (group_id, profile_id, full_name, national_id, phone, otp_verified, otp_sent) VALUES
    (grp3_id, NULL, 'Mary Wanjiku', '49283756', '+254 722 777 890', true, true),
    (grp3_id, NULL, 'Samuel Kiprop', '48475629', '+254 722 888 901', true, true),
    (grp3_id, NULL, 'Joyce Cherono', '47654820', '+254 722 999 012', true, true);

    INSERT INTO group_members (group_id, profile_id, role, status, total_contributed, joined_at) VALUES
    (grp3_id, john_id, 'member', 'active', 25000, '2024-08-03T09:15:00+00:00');

    -- ── Create Group 4: Tech Innovators Chama ──
    INSERT INTO groups (id, group_id, name, description, category, purpose, location, logo_color, status, total_contributions, contributor_count, registered_members, non_registered_contributors, contributions_this_month, transaction_count, created_at, created_by)
    VALUES (gen_random_uuid(), 'GRP-000470', 'Tech Innovators Chama', 'A savings and investment chama for tech professionals building the future.', 'Investment', 'Collective investment & savings', 'Nairobi, Kenya', 'bg-sky-500', 'active', 178600, 96, 78, 18, 24300, 487, '2025-01-18T11:00:00+00:00', john_id)
    RETURNING id INTO grp4_id;

    INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
    VALUES ('200839274613', 'group', grp4_id, 145000);

    INSERT INTO group_founders (group_id, profile_id, full_name, national_id, phone, otp_verified, otp_sent) VALUES
    (grp4_id, NULL, 'Dennis Kariuki', '59283746', '+254 723 111 123', true, true),
    (grp4_id, NULL, 'Faith Mumbi', '58475629', '+254 723 222 234', true, true),
    (grp4_id, NULL, 'Cynthia Auma', '57654820', '+254 723 333 345', true, true);

    INSERT INTO group_members (group_id, profile_id, role, status, total_contributed, joined_at) VALUES
    (grp4_id, john_id, 'member', 'active', 6000, '2025-01-18T11:00:00+00:00');

    -- ── Create Group 5: Greenfield Farmers Co-op ──
    INSERT INTO groups (id, group_id, name, description, category, purpose, location, logo_color, status, total_contributions, contributor_count, registered_members, non_registered_contributors, contributions_this_month, transaction_count, created_at, created_by)
    VALUES (gen_random_uuid(), 'GRP-000488', 'Greenfield Farmers Co-op', 'Pooling resources for seeds, equipment, and shared market access.', 'Agriculture', 'Farming inputs & collective bargaining', 'Eldoret, Kenya', 'bg-success-500', 'pending_verification', 0, 3, 3, 0, 0, 0, '2026-08-10T16:45:00+00:00', john_id)
    RETURNING id INTO grp5_id;

    INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
    VALUES ('200839274614', 'group', grp5_id, 3000);

    INSERT INTO group_founders (group_id, profile_id, full_name, national_id, phone, otp_verified, otp_sent) VALUES
    (grp5_id, john_id, 'John Kamau', '12345678', '+254 712 345 678', true, true),
    (grp5_id, NULL, 'Mercy Chebet', '69283746', '+254 723 444 789', true, true),
    (grp5_id, NULL, 'Patrick Bett', '68475629', '+254 723 555 890', false, false);

    INSERT INTO group_members (group_id, profile_id, role, status, total_contributed, joined_at) VALUES
    (grp5_id, john_id, 'group_admin', 'active', 3000, '2026-08-10T16:45:00+00:00');

    -- Get John's personal wallet ID
    SELECT id INTO wallet_id FROM wallets WHERE owner_type = 'personal' AND owner_id = john_id;

    -- ── Seed transactions for John ──
    -- Top-up
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100001', NULL, wallet_id, NULL, john_id, 30000, 0, 30000, 'top_up', 'm_pesa', 'MPESA100001', 'successful', 'M-Pesa top-up', john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-01T08:00:00+00:00');

    -- Contribution to Good Hope Welfare
    SELECT id INTO grp1_wallet FROM wallets WHERE owner_type = 'group' AND owner_id = grp1_id;
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, group_id, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100002', wallet_id, grp1_wallet, john_id, grp1_id, 5000, 5, 5005, 'contribution', 'm_pesa', 'WTR100002', 'successful', 'Contribution to Good Hope Welfare', grp1_id, john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-14T07:45:00+00:00');

    -- Contribution to Family Support Fund
    SELECT id INTO grp3_wallet FROM wallets WHERE owner_type = 'group' AND owner_id = grp3_id;
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, group_id, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100003', wallet_id, grp3_wallet, john_id, grp3_id, 2500, 5, 2505, 'contribution', 'm_pesa', 'WTR100003', 'successful', 'Contribution to Family Support Fund', grp3_id, john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-13T18:20:00+00:00');

    -- Contribution to Youth Development Group
    SELECT id INTO grp2_wallet FROM wallets WHERE owner_type = 'group' AND owner_id = grp2_id;
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, group_id, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100004', wallet_id, grp2_wallet, john_id, grp2_id, 10000, 5, 10005, 'contribution', 'm_pesa', 'WTR100004', 'successful', 'Contribution to Youth Development Group', grp2_id, john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-12T09:15:00+00:00');

    -- Contribution to Good Hope Welfare
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, group_id, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100005', wallet_id, grp1_wallet, john_id, grp1_id, 7500, 5, 7505, 'contribution', 'm_pesa', 'WTR100005', 'successful', 'Contribution to Good Hope Welfare', grp1_id, john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-10T14:30:00+00:00');

    -- Contribution to Tech Innovators Chama
    SELECT id INTO grp4_wallet FROM wallets WHERE owner_type = 'group' AND owner_id = grp4_id;
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, group_id, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100006', wallet_id, grp4_wallet, john_id, grp4_id, 2000, 5, 2005, 'contribution', 'm_pesa', 'WTR100006', 'successful', 'Contribution to Tech Innovators Chama', grp4_id, john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-08T11:00:00+00:00');

    -- Contribution to Family Support Fund
    INSERT INTO transactions (transaction_id, from_wallet_id, to_wallet_id, from_owner_id, to_owner_id, amount, fee, total_amount, type, payment_method, payment_reference, status, description, group_id, contributor_profile_id, contributor_name, contributor_phone, contributor_kind, umoja_id, created_at)
    VALUES ('TRX-100007', wallet_id, grp3_wallet, john_id, grp3_id, 5000, 5, 5005, 'contribution', 'm_pesa', 'WTR100007', 'successful', 'Contribution to Family Support Fund', grp3_id, john_id, 'John Kamau', '+254 712 345 678', 'registered', 'UMJ-00001842', '2026-08-05T16:45:00+00:00');

    -- ── Seed notifications ──
    INSERT INTO notifications (user_id, kind, title, body, read, group_id, group_name, created_at) VALUES
    (john_id, 'contribution_successful', 'Contribution successful', 'KES 5,000 contributed to Good Hope Welfare. Fee: KES 5.', false, grp1_id, 'Good Hope Welfare', '2026-08-14T07:46:00+00:00'),
    (john_id, 'contribution_successful', 'Contribution successful', 'KES 2,500 contributed to Family Support Fund. Fee: KES 5.', false, grp3_id, 'Family Support Fund', '2026-08-13T18:21:00+00:00'),
    (john_id, 'new_member', 'New member joined', 'Cynthia Auma joined Tech Innovators Chama.', false, grp4_id, 'Tech Innovators Chama', '2026-08-13T10:00:00+00:00'),
    (john_id, 'group_verification', 'Group awaiting verification', 'Greenfield Farmers Co-op is pending — Founder 3 must verify OTP.', true, grp5_id, 'Greenfield Farmers Co-op', '2026-08-10T16:46:00+00:00'),
    (john_id, 'top_up_successful', 'Wallet topped up', 'KES 30,000 added to your wallet via M-Pesa.', true, NULL, NULL, '2026-08-01T08:01:00+00:00'),
    (john_id, 'system_announcement', 'Welcome to UMOJA', 'Your account was created. Start by joining or creating a group.', true, NULL, NULL, '2024-03-15T08:31:00+00:00');

  END IF;
END;
$$;
