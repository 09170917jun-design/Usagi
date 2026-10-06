"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBoard } from "@/lib/boards";
import { deletePost, popularScore, usePosts, useUser, type Post } from "@/lib/store";

const fmt = (t: number) => new Date(t).toLocaleDateString("ko-KR");

export default function BoardView({ slug }: { slug: string }) {
  const board = getBoard(slug)!;
  const router = useRouter();
  const user = useUser();
  const allPosts = usePosts();
  const [query, setQuery] = useState("");

  const base =
    slug === "popular"
      ? [...allPosts].sort((a, b) => popularScore(b) - popularScore(a) || b.createdAt - a.createdAt)
      : allPosts.filter((p) => p.board === slug);
  const q = query.trim().toLowerCase();
  const posts = q
    ? base.filter((p) =>
        [p.title, p.content, p.author].some((s) => s.toLowerCase().includes(q)),
      )
    : base;

  const onWrite = () => {
    if (board.adminOnly && !user?.admin) {
      alert("관리자만 글을 작성할 수 있습니다.");
      return;
    }
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    router.push(`/board/${slug}/write`);
  };

  const onDelete = async (p: Post) => {
    if (!confirm(`"${p.title}" 글을 삭제할까요?`)) return;
    const error = await deletePost(p);
    if (error) alert(error);
  };

  // 본인 글이거나 관리자면 삭제 가능
  const canDelete = (p: Post) => Boolean(user && (user.id === p.authorId || user.admin));

  const deleteBtn = (p: Post, className: string) =>
    canDelete(p) && (
      <button
        type="button"
        onClick={() => onDelete(p)}
        className={`shrink-0 rounded-full border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-400/30 dark:hover:bg-red-500/10 ${className}`}
      >
        삭제
      </button>
    );

  const empty = (
    <p className="py-16 text-center text-sm opacity-50">
      {q ? "검색 결과가 없어요." : "아직 게시글이 없어요."}
    </p>
  );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5">
      <h1 className="mb-4 font-logo text-2xl text-orange-500">
        {board.icon} {board.name}
      </h1>

      {posts.length === 0 ? (
        empty
      ) : board.gallery ? (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="relative overflow-hidden rounded-2xl border border-orange-100 dark:border-white/10"
            >
              <Link href={`/board/${p.board}/${p.id}`} className="block w-full text-left">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-orange-50 text-4xl dark:bg-white/5">
                    🐾
                  </div>
                )}
                <div className={`p-3 text-sm ${canDelete(p) ? "pr-16" : ""}`}>
                  <p className="truncate font-bold">{p.title}</p>
                  <p className="text-xs opacity-60">
                    {p.author} · 조회 {p.views}
                  </p>
                </div>
              </Link>
              {deleteBtn(p, "absolute bottom-3 right-3")}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-orange-100 dark:divide-white/10">
          {posts.map((p) => (
            <li key={p.id} className="py-3 text-sm">
              <div className="flex items-center gap-3">
                <Link
                  href={`/board/${p.board}/${p.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex-1 truncate font-medium hover:underline">{p.title}</span>
                  <span className="hidden opacity-60 sm:inline">{p.author}</span>
                  <span className="opacity-40">{fmt(p.createdAt)}</span>
                  <span className="w-12 text-right opacity-40">{p.views}</span>
                </Link>
                {/* 본인 글이 아닌 줄도 같은 폭을 비워 둬서 열이 어긋나지 않게 함 */}
                <div className="flex w-12 shrink-0 justify-end">{deleteBtn(p, "")}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-orange-50 p-3 dark:bg-white/5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 내용, 작성자 검색"
          aria-label="검색"
          className="min-w-0 flex-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 dark:border-white/20 dark:bg-black/20"
        />
        {!board.readOnly && (
          <button
            onClick={onWrite}
            className="shrink-0 rounded-full bg-orange-400 px-5 py-2 text-sm text-white hover:bg-orange-500"
          >
            글쓰기
          </button>
        )}
      </div>
    </section>
  );
}
