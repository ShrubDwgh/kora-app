-- Kora: skema + Row Level Security. Jalankan sekali di Supabase SQL Editor.
create extension if not exists pgcrypto;

-- ================= TABEL =================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url text,
  bio text check (char_length(bio) <= 200),
  status text check (char_length(status) <= 60),
  created_at timestamptz not null default now()
);
create table community_roles (role text primary key);
insert into community_roles values ('owner'), ('admin'), ('moderator'), ('member');

create table communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 500),
  category text not null default 'lainnya' check (char_length(category) <= 30),
  icon_url text,
  rules text check (char_length(rules) <= 2000),
  is_public boolean not null default true,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now()
);
create table community_members (
  community_id uuid references communities on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text not null default 'member' references community_roles,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create table posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities on delete cascade,
  author_id uuid not null default auth.uid() references profiles on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  parent_id uuid references comments on delete cascade,
  author_id uuid not null default auth.uid() references profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references profiles on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'message')),
  target_id uuid not null,
  emoji text not null check (char_length(emoji) <= 8),
  unique (user_id, target_type, target_id, emoji)
);

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  photo_url text,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now()
);
create table family_members (
  family_id uuid references families on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- Channel komunitas dan chat keluarga adalah conversations dengan kind 'channel' / 'family'.
create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('dm', 'group', 'family', 'channel')),
  title text check (char_length(title) <= 80),
  community_id uuid references communities on delete cascade,
  family_id uuid references families on delete cascade,
  created_by uuid references profiles on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check ((kind = 'channel') = (community_id is not null)),
  check ((kind = 'family') = (family_id is not null))
);
create table conversation_members (
  conversation_id uuid references conversations on delete cascade,
  user_id uuid references profiles on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations on delete cascade,
  sender_id uuid not null default auth.uid() references profiles on delete cascade,
  reply_to uuid references messages on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create table attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages on delete cascade,
  uploader_id uuid not null default auth.uid() references profiles on delete cascade,
  path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind text not null check (kind in ('message', 'mention', 'reply', 'reaction', 'community_invite', 'family_invite', 'announcement', 'family_activity')),
  actor_id uuid references profiles on delete set null,
  conversation_id uuid references conversations on delete cascade,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index on messages (conversation_id, created_at);
create index on posts (community_id, created_at desc);
create index on comments (post_id);
create index on community_members (user_id);
create index on notifications (user_id, created_at desc);

-- ================= FUNGSI PEMERIKSA IZIN =================
create function is_community_member(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from community_members where community_id = cid and user_id = auth.uid()) $$;
create function is_community_staff(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from community_members where community_id = cid and user_id = auth.uid() and role in ('owner', 'admin', 'moderator')) $$;
create function is_community_admin(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from community_members where community_id = cid and user_id = auth.uid() and role in ('owner', 'admin')) $$;
create function can_view_community(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from communities c where c.id = cid and (c.is_public or is_community_member(c.id))) $$;
create function post_community(pid uuid) returns uuid language sql stable security definer set search_path = public as
$$ select community_id from posts where id = pid $$;

create function is_family_member(fid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from family_members where family_id = fid and user_id = auth.uid() and status = 'active') $$;
create function is_family_admin(fid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from family_members where family_id = fid and user_id = auth.uid() and status = 'active' and role = 'admin') $$;
create function family_involved(fid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from family_members where family_id = fid and user_id = auth.uid()) $$;

create function is_conversation_member(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from conversation_members where conversation_id = cid and user_id = auth.uid()) $$;
create function can_access_conversation(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from conversations c where c.id = cid and (
     (c.kind in ('dm', 'group') and is_conversation_member(c.id))
     or (c.kind = 'channel' and is_community_member(c.community_id))
     or (c.kind = 'family' and is_family_member(c.family_id)))) $$;
create function can_view_target(t text, i uuid) returns boolean language sql stable security definer set search_path = public as
$$ select case t
     when 'post' then exists (select 1 from posts p where p.id = i and can_view_community(p.community_id))
     when 'comment' then exists (select 1 from comments c where c.id = i and can_view_community(post_community(c.post_id)))
     when 'message' then exists (select 1 from messages m where m.id = i and can_access_conversation(m.conversation_id))
     else false end $$;

-- ================= RPC (aksi sensitif hanya lewat sini) =================
create function username_available(p_username text) returns boolean language sql stable security definer set search_path = public as
$$ select not exists (select 1 from profiles where username = lower(trim(p_username))) $$;

create function create_community(p_name text, p_description text, p_category text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  insert into communities (name, description, category, created_by)
    values (trim(p_name), nullif(trim(p_description), ''), lower(trim(p_category)), auth.uid()) returning id into cid;
  insert into community_members (community_id, user_id, role) values (cid, auth.uid(), 'owner');
  insert into conversations (kind, title, community_id, created_by) values ('channel', 'umum', cid, auth.uid());
  return cid;
end $$;

create function join_community(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from communities where id = p_id and is_public) then raise exception 'Komunitas tidak tersedia'; end if;
  insert into community_members (community_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
end $$;

create function leave_community(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from community_members where community_id = p_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Pemilik tidak bisa keluar dari komunitasnya';
  end if;
  delete from community_members where community_id = p_id and user_id = auth.uid();
end $$;

create function set_member_role(p_id uuid, p_user uuid, p_role text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_community_admin(p_id) then raise exception 'Hanya admin yang boleh mengubah peran'; end if;
  if p_role not in ('admin', 'moderator', 'member') then raise exception 'Peran tidak valid'; end if;
  update community_members set role = p_role where community_id = p_id and user_id = p_user and role <> 'owner';
end $$;

create function kick_member(p_id uuid, p_user uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_community_staff(p_id) then raise exception 'Tidak diizinkan'; end if;
  delete from community_members
    where community_id = p_id and user_id = p_user and role <> 'owner' and (is_community_admin(p_id) or role = 'member');
end $$;

create function create_family(p_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into families (name, created_by) values (trim(p_name), auth.uid()) returning id into fid;
  insert into family_members (family_id, user_id, role, status) values (fid, auth.uid(), 'admin', 'active');
  insert into conversations (kind, title, family_id, created_by) values ('family', trim(p_name), fid, auth.uid());
  return fid;
end $$;

create function invite_to_family(p_family uuid, p_username text) returns void language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if not is_family_admin(p_family) then raise exception 'Hanya admin keluarga yang bisa mengundang'; end if;
  select id into target from profiles where username = lower(trim(p_username));
  if target is null then raise exception 'Pengguna tidak ditemukan'; end if;
  insert into family_members (family_id, user_id) values (p_family, target) on conflict do nothing;
  insert into notifications (user_id, kind, actor_id, body)
    values (target, 'family_invite', auth.uid(), (select name from families where id = p_family));
end $$;

create function accept_family_invite(p_family uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update family_members set status = 'active', joined_at = now()
    where family_id = p_family and user_id = auth.uid() and status = 'invited';
end $$;

create function start_dm(p_username text) returns uuid language plpgsql security definer set search_path = public as $$
declare other uuid; cid uuid;
begin
  select id into other from profiles where username = lower(trim(p_username));
  if other is null or other = auth.uid() then raise exception 'Pengguna tidak valid'; end if;
  select c.id into cid from conversations c
    where c.kind = 'dm'
      and exists (select 1 from conversation_members m where m.conversation_id = c.id and m.user_id = auth.uid())
      and exists (select 1 from conversation_members m where m.conversation_id = c.id and m.user_id = other)
    limit 1;
  if cid is null then
    insert into conversations (kind, created_by) values ('dm', auth.uid()) returning id into cid;
    insert into conversation_members (conversation_id, user_id) values (cid, auth.uid()), (cid, other);
  end if;
  return cid;
end $$;

create function create_group(p_title text, p_usernames text[]) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if coalesce(array_length(p_usernames, 1), 0) > 50 then raise exception 'Maksimal 50 anggota'; end if;
  insert into conversations (kind, title, created_by) values ('group', left(trim(p_title), 80), auth.uid()) returning id into cid;
  insert into conversation_members (conversation_id, user_id) values (cid, auth.uid());
  insert into conversation_members (conversation_id, user_id)
    select cid, p.id from profiles p
    where p.username in (select lower(trim(u)) from unnest(p_usernames) u) and p.id <> auth.uid()
    on conflict do nothing;
  return cid;
end $$;

-- ================= TRIGGER =================
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
    values (new.id, lower(new.raw_user_meta_data ->> 'username'),
            coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), new.raw_user_meta_data ->> 'username'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function throttle_messages() returns trigger language plpgsql as $$
begin
  if (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '10 seconds') >= 20 then
    raise exception 'Terlalu cepat, coba lagi sebentar';
  end if;
  return new;
end $$;
create trigger trg_throttle before insert on messages for each row execute function throttle_messages();

create function scrub_deleted() returns trigger language plpgsql as $$
begin
  if new.deleted_at is not null then new.body := '.'; end if;
  return new;
end $$;
create trigger trg_scrub before update on messages for each row execute function scrub_deleted();

create function after_message() returns trigger language plpgsql security definer set search_path = public as $$
declare k text;
begin
  select kind into k from conversations where id = new.conversation_id;
  update conversations set last_message_at = now() where id = new.conversation_id;
  if k in ('dm', 'group') then
    insert into notifications (user_id, kind, actor_id, conversation_id, body)
      select user_id, 'message', new.sender_id, new.conversation_id, left(new.body, 80)
      from conversation_members where conversation_id = new.conversation_id and user_id <> new.sender_id;
  end if;
  return new;
end $$;
create trigger trg_after_message after insert on messages for each row execute function after_message();

-- ================= ROW LEVEL SECURITY =================
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy profiles_read on profiles for select to authenticated using (true);
create policy profiles_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy roles_read on community_roles for select to authenticated using (true);

create policy communities_read on communities for select to authenticated using (can_view_community(id));
create policy communities_update on communities for update to authenticated using (is_community_admin(id)) with check (is_community_admin(id));
create policy communities_delete on communities for delete to authenticated using (
  exists (select 1 from community_members m where m.community_id = communities.id and m.user_id = auth.uid() and m.role = 'owner'));
create policy cm_read on community_members for select to authenticated using (can_view_community(community_id));

create policy posts_read on posts for select to authenticated using (can_view_community(community_id));
create policy posts_insert on posts for insert to authenticated with check (author_id = auth.uid() and is_community_member(community_id));
create policy posts_update on posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid() and is_community_member(community_id));
create policy posts_delete on posts for delete to authenticated using (author_id = auth.uid() or is_community_staff(community_id));

create policy comments_read on comments for select to authenticated using (can_view_community(post_community(post_id)));
create policy comments_insert on comments for insert to authenticated with check (author_id = auth.uid() and is_community_member(post_community(post_id)));
create policy comments_delete on comments for delete to authenticated using (author_id = auth.uid() or is_community_staff(post_community(post_id)));

create policy react_read on reactions for select to authenticated using (can_view_target(target_type, target_id));
create policy react_insert on reactions for insert to authenticated with check (user_id = auth.uid() and can_view_target(target_type, target_id));
create policy react_delete on reactions for delete to authenticated using (user_id = auth.uid());

create policy fam_read on families for select to authenticated using (family_involved(id));
create policy fam_update on families for update to authenticated using (is_family_admin(id)) with check (is_family_admin(id));
create policy fam_delete on families for delete to authenticated using (is_family_admin(id));
create policy fm_read on family_members for select to authenticated using (user_id = auth.uid() or is_family_member(family_id));
create policy fm_delete on family_members for delete to authenticated using (user_id = auth.uid() or is_family_admin(family_id));

create policy conv_read on conversations for select to authenticated using (can_access_conversation(id));
create policy cmem_read on conversation_members for select to authenticated using (is_conversation_member(conversation_id));
create policy msg_read on messages for select to authenticated using (can_access_conversation(conversation_id));
create policy msg_insert on messages for insert to authenticated with check (sender_id = auth.uid() and can_access_conversation(conversation_id));
create policy msg_update on messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid() and can_access_conversation(conversation_id));
create policy att_read on attachments for select to authenticated using (can_view_target('message', message_id));
create policy att_insert on attachments for insert to authenticated with check (uploader_id = auth.uid() and can_view_target('message', message_id));
create policy notif_read on notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ================= HAK AKSES & REALTIME =================
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function username_available(text) to anon;

alter publication supabase_realtime add table messages, notifications;
