"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { nicknameAvailable, signup } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nickname, setNickname] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) return alert("Supabase 환경변수(.env.local)가 설정되지 않았습니다.");
    const mail = email.trim();
    const nick = nickname.trim();
    if (!mail || !pw || !nick) return;
    if (pw.length < 6) return alert("비밀번호는 6자 이상이어야 합니다.");
    if (pw !== pw2) return alert("비밀번호가 일치하지 않습니다.");
    if (!(await nicknameAvailable(nick))) return alert("이미 사용 중인 닉네임입니다.");
    const result = await signup(mail, pw, nick);
    if ("error" in result) return alert(`회원가입에 실패했습니다.
${result.error}`);
    if (result.status === "confirm") {
      alert("가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.");
      return router.push("/login");
    }
    router.push("/");
  };

  const field =
    "w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 dark:border-white/20 dark:bg-black/20";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-sm space-y-3 rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5"
    >
      <h1 className="font-logo text-2xl text-orange-500">회원가입</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className={field} />
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" className={field} />
      <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="비밀번호 확인" className={field} />
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임" maxLength={12} className={field} />
      <button type="submit" className="w-full rounded-full bg-orange-400 py-2 text-sm text-white hover:bg-orange-500">
        가입하기
      </button>
    </form>
  );
}
