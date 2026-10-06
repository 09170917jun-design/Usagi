import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "./supabase";

export type Post = {
  id: string;
  board: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  views: number;
  createdAt: number;
};

export type User = { id: string; name: string; admin: boolean } | null;

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
  views: number;
  created_at: string;
  profiles: { nickname: string } | null;
};

export async function refreshPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, board, title, content, image, views, created_at, profiles(nickname)")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<PostRow[]>();
  if (error || !data) return;
  postStore.set(
    data.map((r) => ({
      id: r.id,
      board: r.board,
      title: r.title,
      content: r.content,
      author: r.profiles?.nickname ?? "알 수 없음",
      image: r.image ?? undefined,
      views: r.views,
      createdAt: Date.parse(r.created_at),
    })),
  );
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

export async function viewPost(id: string) {
  await supabase.rpc("increment_views", { post_id: id });
  postStore.set(postStore.get().map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p)));
}

// ---------- 인증 ----------
type AuthState = { loading: boolean; user: User };
const authStore = createStore<AuthState>({ loading: true, user: null });
let authStarted = false;

async function loadUser(session: { user: { id: string } } | null) {
  if (!session) return authStore.set({ loading: false, user: null });
  const { data } = await supabase
    .from("profiles")
    .select("nickname, role")
    .eq("id", session.user.id)
    .single();
  authStore.set({
    loading: false,
    user: data ? { id: session.user.id, name: data.nickname, admin: data.role === "admin" } : null,
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

function useAuthState() {
  useEffect(startAuth, []);
  return useSyncExternalStore(authStore.subscribe, authStore.get, () => ({
    loading: true,
    user: null,
  }));
}

export const useUser = (): User => useAuthState().user;
export const useAuthLoading = (): boolean => useAuthState().loading;

export async function login(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? "이메일 또는 비밀번호가 올바르지 않습니다." : null;
}

export async function logout() {
  await supabase.auth.signOut();
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
