import { useEffect, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Post = {
  id: string;
  board: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  image?: string;
  views: number;
  createdAt: number;
};

export type Comment = {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: number;
};

export type User = {
  id: string;
  name: string;
  admin: boolean;
  email?: string;
  avatar?: string;
  provider?: string;
} | null;

// ---------- 공통: 구독 가능한 작은 스토어 ----------
function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
  };
}

// ---------- 게시글 ----------
const EMPTY_POSTS: Post[] = [];
const postStore = createStore<Post[]>(EMPTY_POSTS);

type PostRow = {
  id: string;
  board: string;
  title: string;
  content: string;
  image: string | null;
  author_id: string;
  views: number;
  created_at: string;
  profiles: { nickname: string } | null;
};

const POST_COLUMNS = "id, board, title, content, image, author_id, views, created_at, profiles(nickname)";

const toPost = (r: PostRow): Post => ({
  id: r.id,
  board: r.board,
  title: r.title,
  content: r.content,
  author: r.profiles?.nickname ?? "알 수 없음",
  authorId: r.author_id,
  image: r.image ?? undefined,
  views: r.views,
  createdAt: Date.parse(r.created_at),
});

export async function refreshPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<PostRow[]>();
  if (error || !data) return;
  postStore.set(data.map(toPost));
}

/** 글 한 건 조회. 없으면 null */
export async function fetchPost(id: string): Promise<Post | null> {
  const { data } = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle<PostRow>();
  return data ? toPost(data) : null;
}

export function usePosts(): Post[] {
  useEffect(() => {
    void refreshPosts();
  }, []);
  return useSyncExternalStore(postStore.subscribe, postStore.get, () => EMPTY_POSTS);
}

/** 성공 시 null, 실패 시 오류 메시지 */
export async function addPost(
  input: { board: string; title: string; content: string },
  imageFile?: File,
  userId?: string,
): Promise<string | null> {
  let image: string | null = null;
  if (imageFile && userId) {
    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("gallery").upload(path, imageFile);
    if (up.error) return `이미지 업로드 실패: ${up.error.message}`;
    image = supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase.from("posts").insert({ ...input, image });
  if (error) return error.message;
  await refreshPosts();
  return null;
}

/** 본인 글 삭제 (DB 정책도 작성자만 허용). 성공 시 null, 실패 시 오류 메시지 */
export async function deletePost(post: Post): Promise<string | null> {
  // .select()로 실제 삭제된 행이 있는지 확인 (권한이 없으면 오류 없이 0건 삭제됨)
  const { data, error } = await supabase.from("posts").delete().eq("id", post.id).select("id");
  if (error) return error.message;
  if (!data?.length) return "삭제 권한이 없거나 이미 삭제된 글입니다.";
  // 갤러리 이미지도 정리 (실패해도 글 삭제에는 영향 없음)
  const marker = "/gallery/";
  if (post.image?.includes(marker)) {
    await supabase.storage.from("gallery").remove([decodeURIComponent(post.image.split(marker)[1])]);
  }
  postStore.set(postStore.get().filter((p) => p.id !== post.id));
  return null;
}

// ---------- 댓글 ----------
type CommentRow = {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles: { nickname: string } | null;
};

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("comments")
    .select("id, content, author_id, created_at, profiles(nickname)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();
  return (data ?? []).map((r) => ({
    id: r.id,
    author: r.profiles?.nickname ?? "알 수 없음",
    authorId: r.author_id,
    content: r.content,
    createdAt: Date.parse(r.created_at),
  }));
}

/** 성공 시 null, 실패 시 오류 메시지 */
export async function addComment(postId: string, content: string): Promise<string | null> {
  const { error } = await supabase.from("comments").insert({ post_id: postId, content });
  return error ? error.message : null;
}

export async function deleteComment(id: string): Promise<string | null> {
  const { data, error } = await supabase.from("comments").delete().eq("id", id).select("id");
  if (error) return error.message;
  return data?.length ? null : "삭제 권한이 없거나 이미 삭제된 댓글입니다.";
}

export async function viewPost(id: string) {
  await supabase.rpc("increment_views", { post_id: id });
  postStore.set(postStore.get().map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p)));
}

// ---------- 인증 ----------
type AuthState = { loading: boolean; user: User };
const authStore = createStore<AuthState>({ loading: true, user: null });
let authStarted = false;

async function loadUser(session: Session | null) {
  if (!session) return authStore.set({ loading: false, user: null });
  const { data } = await supabase
    .from("profiles")
    .select("nickname, role, avatar_url")
    .eq("id", session.user.id)
    .single();
  const meta = session.user.user_metadata ?? {};
  authStore.set({
    loading: false,
    user: data
      ? {
          id: session.user.id,
          name: data.nickname,
          admin: data.role === "admin",
          email: session.user.email,
          // 직접 올린 사진이 우선, 없으면 카카오 사진. 카카오는 http:// 주소를 주는데
          // https 사이트에서는 차단되므로 https로 올림
          avatar: (data.avatar_url ?? meta.avatar_url ?? meta.picture)?.replace(/^http:\/\//, "https://"),
          provider: session.user.app_metadata?.provider,
        }
      : null,
  });
}

function startAuth() {
  if (authStarted) return;
  authStarted = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    // 콜백 안에서 바로 supabase 호출 시 교착 위험이 있어 다음 틱으로 미룸
    setTimeout(() => void loadUser(session), 0);
  });
}

const SERVER_AUTH: AuthState = { loading: true, user: null };

function useAuthState() {
  useEffect(startAuth, []);
  // getServerSnapshot은 매번 같은 객체를 돌려줘야 무한 루프 경고가 나지 않음
  return useSyncExternalStore(authStore.subscribe, authStore.get, () => SERVER_AUTH);
}

export const useUser = (): User => useAuthState().user;
export const useAuthLoading = (): boolean => useAuthState().loading;

export async function login(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? "이메일 또는 비밀번호가 올바르지 않습니다." : null;
}

/** 카카오 OAuth 로그인 시작 (성공 시 카카오 페이지로 이동). 실패 시 오류 메시지 */
export async function loginWithKakao(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: window.location.origin },
  });
  return error ? error.message : null;
}

export async function logout() {
  await supabase.auth.signOut();
}

async function reloadUser() {
  const { data } = await supabase.auth.getSession();
  await loadUser(data.session);
}

/** 성공 시 null, 실패 시 오류 메시지 */
export async function updateNickname(userId: string, nickname: string): Promise<string | null> {
  const { error } = await supabase.from("profiles").update({ nickname }).eq("id", userId);
  if (error) return error.code === "23505" ? "이미 사용 중인 닉네임입니다." : error.message;
  await reloadUser();
  void refreshPosts();
  return null;
}

/** 새 사진을 올리고 프로필에 반영. 성공 시 null, 실패 시 오류 메시지 */
export async function updateAvatar(userId: string, file: File, prevUrl?: string): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("avatars").upload(path, file);
  if (up.error) return `이미지 업로드 실패: ${up.error.message}`;
  const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error) return error.message;
  // 이전에 올렸던 사진은 정리 (실패해도 무시)
  const marker = "/avatars/";
  if (prevUrl?.includes(marker)) {
    await supabase.storage.from("avatars").remove([decodeURIComponent(prevUrl.split(marker)[1])]);
  }
  await reloadUser();
  return null;
}

/** 직접 올린 사진을 지우고 기본(카카오) 사진으로 되돌림 */
export async function resetAvatar(userId: string, prevUrl?: string): Promise<string | null> {
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  if (error) return error.message;
  const marker = "/avatars/";
  if (prevUrl?.includes(marker)) {
    await supabase.storage.from("avatars").remove([decodeURIComponent(prevUrl.split(marker)[1])]);
  }
  await reloadUser();
  return null;
}

export async function nicknameAvailable(nickname: string): Promise<boolean> {
  const { data } = await supabase.rpc("nickname_available", { n: nickname });
  return data === true;
}

/** 'ok' = 가입 및 로그인 완료, 'confirm' = 확인 메일 발송됨, 그 외 오류 메시지 */
export async function signup(
  email: string,
  password: string,
  nickname: string,
): Promise<{ status: "ok" | "confirm" } | { error: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
  if (error) return { error: error.message };
  return { status: data.session ? "ok" : "confirm" };
}
