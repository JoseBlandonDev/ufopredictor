create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'free_user'
  );

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
