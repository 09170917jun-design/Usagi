"use client";

import Link from "next/link";
import { BOARDS } from "@/lib/boards";
import { popularScore, usePosts } from "@/lib/store";

export default function Home() {
  const posts = usePosts();
  const latest = posts.slice(0, 6);
  const popular = [...posts]
    .sort((a, b) => popularScore(b) - popularScore(a) || b.createdAt - a.createdAt)
    .slice(0, 5);
  const boardName = (slug: string) => BOARDS.find((b) => b.slug === slug)?.name ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5">
        <h2 className="mb-3 font-logo text-xl text-orange-500">최신 글</h2>
        {latest.length === 0 ? (
          <p className="py-10 text-center text-sm opacity-50">아직 게시글이 없어요.</p>
        ) : (
          <ul className="divide-y divide-orange-100 dark:divide-white/10">
            {latest.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/50 dark:text-orange-200">
                  {boardName(p.board)}
                </span>
                <Link href={`/board/${p.board}/${p.id}`} className="flex-1 truncate hover:underline">
                  {p.title}
                </Link>
                <span className="hidden opacity-60 sm:inline">{p.author}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5">
        <h2 className="mb-3 font-logo text-xl text-orange-500">인기 글</h2>
        {popular.length === 0 ? (
          <p className="py-4 text-center text-sm opacity-50">아직 순위가 없어요.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {popular.map((p, i) => (
              <li key={p.id} className="flex gap-2">
                <span className="w-4 font-bold text-orange-500">{i + 1}</span>
                <Link href={`/board/${p.board}/${p.id}`} className="truncate hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
