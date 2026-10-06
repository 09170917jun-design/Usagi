import { useMemo, useSyncExternalStore } from "react";

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

export type User = { name: string; admin: boolean } | null;

function createStore(key: string) {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === key && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    read(): string {
      try {
        return localStorage.getItem(key) ?? "";
      } catch {
        return "";
      }
    },
    write(value: string | null): boolean {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        return false;
      }
      emit();
      return true;
    },
  };
}

const postStore = createStore("usagi:posts");
const userStore = createStore("usagi:user");

function parse<T>(raw: string, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function usePosts(): Post[] {
  const raw = useSyncExternalStore(postStore.subscribe, postStore.read, () => "");
  return useMemo(() => parse<Post[]>(raw, []), [raw]);
}

export function useUser(): User {
  const raw = useSyncExternalStore(userStore.subscribe, userStore.read, () => "");
  return useMemo(() => parse<User>(raw, null), [raw]);
}

export const addPost = (posts: Post[], post: Post) =>
  postStore.write(JSON.stringify([post, ...posts]));

export const viewPost = (posts: Post[], id: string) =>
  postStore.write(
    JSON.stringify(posts.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p))),
  );

export const login = (user: NonNullable<User>) => userStore.write(JSON.stringify(user));
export const logout = () => userStore.write(null);

// 데모용 회원 목록 (브라우저 localStorage, 비밀번호 평문 저장 — 실서비스 아님)
type Account = { id: string; pw: string; nickname?: string };
const accountStore = createStore("usagi:accounts");
const readAccounts = () => parse<Account[]>(accountStore.read(), []);

export const findAccount = (id: string) => readAccounts().find((a) => a.id === id);

export const nicknameTaken = (nickname: string) =>
  nickname === "관리자" ||
  readAccounts().some((a) => (a.nickname ?? a.id) === nickname);

export function signup(id: string, pw: string, nickname: string): boolean {
  return accountStore.write(JSON.stringify([...readAccounts(), { id, pw, nickname }]));
}
