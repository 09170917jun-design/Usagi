"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { addComment, deleteComment, fetchComments, useUser, type Comment } from "@/lib/store";

const MAX = 500;
const fmt = (t: number) =>
  new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Comments({ postId }: { postId: string }) {
  const user = useUser();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setComments(await fetchComments(postId)), [postId]);

  useEffect(() => {
    let alive = true;
    void fetchComments(postId).then((c) => alive && setComments(c));
    return () => {
      alive = false;
    };
  }, [postId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    const error = await addComment(postId, content);
    setBusy(false);
    if (error) return alert(`댓글을 저장하지 못했어요.\n${error}`);
    setText("");
    await load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    const error = await deleteComment(id);
    if (error) return alert(error);
    await load();
  };

  return (
    <div className="mt-3 space-y-3 text-sm">
      <h3 className="font-bold">댓글 {comments?.length ?? 0}</h3>

      {comments === null ? (
        <p className="opacity-50">불러오는 중…</p>
      ) : comments.length === 0 ? (
        <p className="opacity-50">첫 댓글을 남겨 보세요.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white p-3 dark:bg-black/20">
              <div className="flex items-center gap-2 text-xs opacity-60">
                <span className="font-bold">{c.author}</span>
                <span>{fmt(c.createdAt)}</span>
                {user?.id === c.authorId && (
                  <button onClick={() => onDelete(c.id)} className="ml-auto text-red-500 hover:underline">
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX}
            placeholder="댓글을 입력하세요"
            aria-label="댓글 입력"
            className="min-w-0 flex-1 rounded-full border border-orange-200 bg-white px-4 py-2 outline-none focus:border-orange-400 dark:border-white/20 dark:bg-black/20"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="shrink-0 rounded-full bg-orange-400 px-4 py-2 text-white hover:bg-orange-500 disabled:opacity-50"
          >
            등록
          </button>
        </form>
      ) : (
        <p className="rounded-2xl bg-white p-3 text-center dark:bg-black/20">
          댓글은 회원만 작성할 수 있어요.{" "}
          <Link href="/login" className="font-bold text-orange-500 hover:underline">
            로그인
          </Link>
          {" · "}
          <Link href="/signup" className="font-bold text-orange-500 hover:underline">
            회원가입
          </Link>
        </p>
      )}
    </div>
  );
}
