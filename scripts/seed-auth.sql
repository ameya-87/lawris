-- Seed the demo advocate into Supabase Auth so judges can sign in.
-- Run once in Supabase SQL Editor AFTER migrate.sql + seed.sql.
-- Idempotent: drops existing auth rows for this user before re-inserting.
--
-- Credentials created:
--   Email:    priya.mehta@advocate.in
--   Password: Lawris2026!
--   Bar No.:  MAH/12345/2018  (also usable as sign-in identifier)
--
-- The auth.users.id MUST match the seeded public.users.id so that
-- getSessionUser() finds the profile and all lawyer_id FKs line up.

do $$
declare
  v_user_id uuid := '11111111-1111-1111-1111-111111111111';
  v_email   text := 'priya.mehta@advocate.in';
  v_password text := 'Lawris2026!';
begin
  -- Wipe any prior auth state for this user
  delete from auth.identities where user_id = v_user_id;
  delete from auth.users where id = v_user_id;

  -- Insert the auth user with a known bcrypted password
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_super_admin, confirmation_token, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Priya Mehta, Advocate', 'bar_council_no', 'MAH/12345/2018'),
    now(), now(),
    false, '', ''
  );

  -- Insert the identity row (required by modern Supabase Auth for login)
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email',
    now(), now(), now()
  );
end $$;

-- Verify
select id, email, email_confirmed_at is not null as confirmed
from auth.users
where id = '11111111-1111-1111-1111-111111111111';
