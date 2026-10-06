"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { castVote, fetchVotes, useUser, type Votes } from "@/lib/store";

export default function VoteButtons({ postId }: { postId: string }) {
  const router = useRouter();
  const user = useUser();
  const userId = user?.id;
  const [votes, setVotes] = useState<Votes>({ up: 0, down: 0, mine: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchVotes(postId, userId).then((v) => alive && setVotes(v));
    return () => {
      alive = false;
    };
  }, [postId, userId]);

  const vote = async (value: 1 | -1) => {
    if (!user) {
      alert("추천/비추천은 로그인한 회원만 할 수 있어요.");
      router.push("/login");
      return;
    }
    if (votes.mine !== null) return alert("이미 투표한 글입니다.");
    if (busy) return;
    setBusy(true);
    const error = await castVote(postId, value);
    if (error) alert(error);
    setVotes(await fetchVotes(postId, userId));
    setBusy(false);
  };

  const base = "flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-medium transition disabled:cursor-default";
  const pick = (value: 1 | -1, on: string) =>
    votes.mine === value
      ? on
      : votes.mine !== null
        ? "border-orange-100 opacity-40 dark:border-white/10"
        : "border-orange-300 hover:bg-orange-50 dark:border-white/20 dark:hover:bg-white/10";

  return (
    <div className="mt-6 flex justify-center gap-3">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={busy}
        aria-pressed={votes.mine === 1}
        className={`${base} ${pick(1, "border-orange-400 bg-orange-400 text-white")}`}
      >
        👍 추천 <span>{votes.up}</span>
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={busy}
        aria-pressed={votes.mine === -1}
        className={`${base} ${pick(-1, "border-sky-500 bg-sky-500 text-white")}`}
      >
        👎 비추천 <span>{votes.down}</span>
      </button>
    </div>
  );
}
