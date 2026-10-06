"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Avatar from "@/components/Avatar";
import { logout, useAuthLoading, useUser } from "@/lib/store";

const PROVIDERS: Record<string, string> = { kakao: "카카오", email: "이메일" };

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const loading = useAuthLoading();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (!user) return <p className="text-sm opacity-60">{loading ? "불러오는 중..." : "로그인이 필요합니다."}</p>;

  const rows: [string, string][] = [
    ["닉네임", user.name],
    ["이메일", user.email ?? "등록된 이메일 없음"],
    ["로그인 방식", PROVIDERS[user.provider ?? ""] ?? user.provider ?? "-"],
    ["등급", user.admin ? "관리자" : "일반 회원"],
  ];

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
      <h1 className="font-logo text-2xl text-orange-500">개인정보</h1>
      <div className="flex justify-center">
        <Avatar user={user} size={96} />
      </div>
      <dl className="divide-y divide-orange-100 text-sm dark:divide-white/10">
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
