"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseConfigured } from "@/lib/supabase";
import { login } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const done = () => router.push("/");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) return alert("Supabase 환경변수(.env.local)가 설정되지 않았습니다.");
    if (!email.trim() || !pw) return;
    const error = await login(email.trim(), pw);
    if (error) return alert(error);
    done();
  };

  const comingSoon = () => alert("소셜 로그인은 준비 중입니다.");

  const field =
    "w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 dark:border-white/20 dark:bg-black/20";
  const btn = "flex w-full items-center justify-center gap-2 rounded-full py-2 text-sm font-medium";

  return (
    <div className="mx-auto max-w-sm space-y-3 rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
      <h1 className="font-logo text-2xl text-orange-500">로그인</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className={field} />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="비밀번호"
          className={field}
        />
        <button type="submit" className={`${btn} bg-orange-400 text-white hover:bg-orange-500`}>
          로그인
        </button>
      </form>

      <Link
        href="/signup"
        className={`${btn} border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-white/10`}
      >
        회원가입
      </Link>

      <button
        type="button"
        onClick={comingSoon}
        className={`${btn} bg-[#FEE500] text-[#191919] hover:brightness-95`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#191919"
            d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.9 5.37 4.75 6.78l-.97 3.55a.4.4 0 0 0 .6.43L10.5 19.2c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8S17.52 3 12 3z"
          />
        </svg>
        카카오톡으로 로그인
      </button>

      <button
        type="button"
        onClick={comingSoon}
        className={`${btn} border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]`}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Google 계정으로 로그인
      </button>
    </div>
  );
}
