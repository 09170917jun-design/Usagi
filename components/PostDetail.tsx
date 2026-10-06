"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Comments from "@/components/Comments";
import { getBoard } from "@/lib/boards";
import { deletePost, fetchPost, useUser, viewPost, type Post } from "@/lib/store";

const fmt = (t: number) =>
  new Date(t).toLocaleString("ko-KR", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function PostDetail({ slug, id }: { slug: string; id: string }) {
  const router = useRouter();
  const user = useUser();
  const [post, setPost] = useState<Post | null | undefined>(undefined); // undefined = 불러오는 중
  const board = getBoard(slug)!;
  const listHref = `/board/${slug}`;

  useEffect(() => {
    let alive = true;
    // 조회수를 올린 뒤 글을 읽어 와서 최신 조회수를 보여줌
    void viewPost(id)
      .then(() => fetchPost(id))
      .then((p) => alive && setPost(p));
    return () => {
      alive = false;
    };
  }, [id]);

  const onDelete = async () => {
    if (!post || !confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    const error = await deletePost(post);
    if (error) return alert(error);
    router.push(listHref);
  };

  if (post === undefined) return <p className="py-16 text-center text-sm opacity-50">불러오는 중…</p>;
  if (post === null) {
    return (
      <section className="rounded-3xl bg-white p-10 text-center text-sm shadow-sm dark:bg-white/5">
        <p className="opacity-60">글을 찾을 수 없어요. 삭제되었을 수 있어요.</p>
        <Link href={listHref} className="mt-4 inline-block font-bold text-orange-500 hover:underline">
          목록으로
        </Link>
      </section>
    );
  }

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5">
      <p className="text-xs text-orange-500">
        {board.icon} {board.name}
      </p>
      <h1 className="mt-1 break-words font-logo text-2xl">{post.title}</h1>
      <div className="mt-1 flex items-center justify-between gap-3 border-b border-orange-100 pb-3 dark:border-white/10">
        <p className="text-xs opacity-60">
          {post.author} · {fmt(post.createdAt)} · 조회 {post.views}
        </p>
        {user && (user.id === post.authorId || user.admin) && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto shrink-0 rounded-full border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-400/30 dark:hover:bg-red-500/10"
          >
            삭제
          </button>
        )}
      </div>

      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt={post.title} className="mt-4 max-h-[32rem] w-full rounded-2xl object-contain" />
      )}
      <p className="mt-4 min-h-24 whitespace-pre-wrap break-words text-sm">{post.content}</p>

      <hr className="my-5 border-orange-100 dark:border-white/10" />
      <Comments postId={post.id} />

      <div className="mt-6 flex justify-end">
        <Link
          href={listHref}
          className="rounded-full border border-orange-300 px-5 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-white/10"
        >
          목록
        </Link>
      </div>
    </article>
  );
}
