create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_full_name text;
  resolved_avatar_url text;
begin
  resolved_full_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', '')
  );

  resolved_avatar_url := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    resolved_full_name,
    resolved_avatar_url,
    'free_user'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url);

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_profile_updated on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create trigger on_auth_user_profile_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_auth_user();
