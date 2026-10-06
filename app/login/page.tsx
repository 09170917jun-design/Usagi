"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseConfigured } from "@/lib/supabase";
import { login, loginWithKakao } from "@/lib/store";

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

  const onKakao = async () => {
    if (!supabaseConfigured) return alert("Supabase 환경변수(.env.local)가 설정되지 않았습니다.");
    const error = await loginWithKakao();
    if (error) alert(error);
  };

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
        onClick={onKakao}
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
    </div>
  );
}
