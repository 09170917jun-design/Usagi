"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getBoard } from "@/lib/boards";
import { addPost, useAuthLoading, useUser } from "@/lib/store";

const MAX_IMAGE = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"]; // gallery 버킷 허용 형식과 동일

export default function WriteForm({ slug }: { slug: string }) {
  const board = getBoard(slug)!;
  const router = useRouter();
  const user = useUser();
  const loading = useAuthLoading();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading) return null;
  if (!user || (board.adminOnly && !user.admin)) {
    return (
      <section className="rounded-3xl bg-white p-10 text-center text-sm shadow-sm dark:bg-white/5">
        {user ? "관리자만 글을 작성할 수 있습니다." : "로그인이 필요합니다."}
      </section>
    );
  }

  const onFile = (f?: File) => {
    if (f && !ACCEPT.includes(f.type)) {
      alert("JPG, PNG, WEBP, GIF 이미지만 올릴 수 있어요.");
      return;
    }
    if (f && f.size > MAX_IMAGE) {
      alert("이미지는 5MB 이하만 올릴 수 있어요.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : undefined);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || busy) return;
    setBusy(true);
    const error = await addPost(
      { board: slug, title: title.trim(), content: content.trim() },
      file,
      user.id,
    );
    setBusy(false);
    if (error) return alert(`글을 저장하지 못했어요.\n${error}`);
    router.push(`/board/${slug}`);
  };

  const field =
    "w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 dark:border-white/20 dark:bg-black/20";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5">
      <h1 className="font-logo text-2xl text-orange-500">
        {board.icon} {board.name} 글쓰기
      </h1>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className={field} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용"
        rows={10}
        className={field}
      />
      {board.gallery && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center text-sm ${
            dragging ? "border-orange-400 bg-orange-50 dark:bg-white/10" : "border-orange-200 dark:border-white/20"
          }`}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="미리보기" className="max-h-56 rounded-2xl" />
              <button type="button" onClick={() => onFile(undefined)} className="text-xs text-red-500 hover:underline">
                사진 제거
              </button>
            </>
          ) : (
            <p className="opacity-60">
              여기로 사진을 끌어다 놓거나
              <br />
              아래 <b>사진 추가하기</b> 버튼으로 컴퓨터에서 골라 주세요. (5MB 이하)
            </p>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(",")}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        hidden
      />
      <div className="flex justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full px-5 py-2 hover:bg-orange-100 dark:hover:bg-white/10"
        >
          취소
        </button>
        {board.gallery && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-orange-300 px-5 py-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-white/10"
          >
            사진 추가하기
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-orange-400 px-5 py-2 text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {busy ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
