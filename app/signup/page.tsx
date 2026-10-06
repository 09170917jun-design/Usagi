"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN } from "@/lib/boards";
import { findAccount, login, nicknameTaken, signup } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nickname, setNickname] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = id.trim();
    const nick = nickname.trim();
    if (!name || !pw || !nick) return;
    if (name === ADMIN.id || findAccount(name)) return alert("이미 사용 중인 아이디입니다.");
    if (pw !== pw2) return alert("비밀번호가 일치하지 않습니다.");
    if (nicknameTaken(nick)) return alert("이미 사용 중인 닉네임입니다.");
    if (!signup(name, pw, nick)) return alert("회원가입에 실패했습니다.");
    login({ name: nick, admin: false });
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
      <input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" className={field} />
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" className={field} />
      <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="비밀번호 확인" className={field} />
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임" maxLength={12} className={field} />
      <button type="submit" className="w-full rounded-full bg-orange-400 py-2 text-sm text-white hover:bg-orange-500">
        가입하기
      </button>
    </form>
  );
}
