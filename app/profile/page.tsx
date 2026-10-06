"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { logout, resetAvatar, updateAvatar, updateNickname, useAuthLoading, useUser } from "@/lib/store";

const PROVIDERS: Record<string, string> = { kakao: "카카오", email: "이메일" };
const MAX_AVATAR = 2 * 1024 * 1024;

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const loading = useAuthLoading();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nick, setNick] = useState<string | null>(null); // null = 편집 중 아님
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (!user) return <p className="text-sm opacity-60">{loading ? "불러오는 중..." : "로그인이 필요합니다."}</p>;

  const run = async (job: () => Promise<string | null>) => {
    setBusy(true);
    const error = await job();
    setBusy(false);
    if (error) alert(error);
    return !error;
  };

  const saveNick = async () => {
    const next = (nick ?? "").trim();
    if (!next) return alert("닉네임을 입력해 주세요.");
    if (next === user.name) return setNick(null);
    if (await run(() => updateNickname(user.id, next))) setNick(null);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("이미지 파일만 올릴 수 있습니다.");
    if (file.size > MAX_AVATAR) return alert("사진은 2MB 이하만 올릴 수 있습니다.");
    await run(() => updateAvatar(user.id, file, user.avatar));
  };

  const customAvatar = Boolean(user.avatar?.includes("/avatars/"));
  const small = "rounded-full px-3 py-1 text-xs disabled:opacity-50";
  const rows: [string, string][] = [
    ["이메일", user.email ?? "등록된 이메일 없음"],
    ["로그인 방식", PROVIDERS[user.provider ?? ""] ?? user.provider ?? "-"],
    ["등급", user.admin ? "관리자" : "일반 회원"],
  ];

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
      <h1 className="font-logo text-2xl text-orange-500">개인정보</h1>

      <div className="flex flex-col items-center gap-2">
        <Avatar user={user} size={96} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} hidden />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className={`${small} bg-orange-400 text-white hover:bg-orange-500`}
          >
            사진 변경
          </button>
          {customAvatar && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => resetAvatar(user.id, user.avatar))}
              className={`${small} border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-white/10`}
            >
              기본 사진으로
            </button>
          )}
        </div>
        <p className="text-xs opacity-50">JPG, PNG, WEBP, GIF · 2MB 이하</p>
      </div>

      <dl className="divide-y divide-orange-100 text-sm dark:divide-white/10">
        <div className="flex items-center justify-between gap-4 py-2">
          <dt className="opacity-60">닉네임</dt>
          <dd className="flex items-center gap-2">
            {nick === null ? (
              <>
                <span>{user.name}</span>
                <button
                  type="button"
                  onClick={() => setNick(user.name)}
                  className={`${small} border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-white/10`}
                >
                  변경
                </button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveNick();
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  maxLength={12}
                  className="w-32 rounded-2xl border border-orange-200 bg-white px-3 py-1 text-sm outline-none focus:border-orange-400 dark:border-white/20 dark:bg-black/20"
                />
                <button type="submit" disabled={busy} className={`${small} bg-orange-400 text-white hover:bg-orange-500`}>
                  저장
                </button>
                <button type="button" onClick={() => setNick(null)} className={`${small} opacity-60`}>
                  취소
                </button>
              </form>
            )}
          </dd>
        </div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="opacity-60">{k}</dt>
            <dd className="break-all text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2">
        <Link
          href="/"
          className="flex-1 rounded-full border border-orange-300 py-2 text-center text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-white/10"
        >
          홈으로
        </Link>
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="flex-1 rounded-full bg-orange-400 py-2 text-sm font-medium text-white hover:bg-orange-500"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
