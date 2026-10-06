-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요.

-- 1) 프로필 (닉네임 / 권한)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 1 and 12),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- 가입 시 auth.users 메타데이터의 nickname 으로 프로필 자동 생성
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 닉네임 중복 확인 (가입 전, 비로그인 상태에서도 호출)
create function public.nickname_available(n text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where nickname = n) and n <> '관리자';
$$;
grant execute on function public.nickname_available(text) to anon, authenticated;

-- 관리자 여부
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 2) 게시글
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('notice', 'free', 'qna', 'gallery', 'event')),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 10000),
  image text,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  views integer not null default 0,
  created_at timestamptz not null default now()
);
create index posts_board_created_idx on public.posts (board, created_at desc);

-- 조회수 증가 (일반 사용자는 posts 를 직접 수정할 수 없으므로 함수로만 허용)
create function public.increment_views(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set views = views + 1 where id = post_id;
$$;
grant execute on function public.increment_views(uuid) to anon, authenticated;

-- 3) RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

create policy "profiles readable" on public.profiles for select using (true);

create policy "posts readable" on public.posts for select using (true);

create policy "posts insert" on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and (board not in ('notice', 'event') or public.is_admin())
  );

create policy "posts delete own or admin" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 4) 갤러리 이미지 저장소
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "gallery upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "gallery read" on storage.objects for select using (bucket_id = 'gallery');

-- 5) 관리자 지정 (가입 후 본인 이메일로 한 번 실행)
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = '내이메일@example.com');
