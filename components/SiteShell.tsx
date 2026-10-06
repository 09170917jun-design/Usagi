"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOARDS } from "@/lib/boards";
import Avatar from "@/components/Avatar";
import { logout, useUser } from "@/lib/store";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUser();

  return (
    <div className="flex min-h-screen flex-col text-[#4a3b32] dark:text-[#f6e9dc]">
      <header className="border-b-2 border-dashed border-orange-200 bg-white/70 backdrop-blur dark:border-orange-900 dark:bg-black/20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-logo text-4xl tracking-tight text-sky-500">
            치이카와
          </Link>
          <nav className="hidden gap-6 text-sm sm:flex">
            <Link href="/">홈</Link>
            <Link href="/board/free">게시판</Link>
            <Link href="/board/popular">인기</Link>
            <Link href="/board/gallery">갤러리</Link>
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <Link href="/profile" aria-label="개인정보" title="개인정보" className="shrink-0">
                  <Avatar user={user} size={32} />
                </Link>
                <span className="opacity-70">
                  {user.admin && "👑 "}
                  {user.name}님
                </span>
                <button
                  onClick={logout}
                  className="rounded-full px-4 py-1.5 hover:bg-orange-100 dark:hover:bg-white/10"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-orange-400 px-4 py-1.5 text-white hover:bg-orange-500"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {pathname === "/" && (
          <section
            aria-label="메인 배너"
            className="relative mb-6 h-72 w-full overflow-hidden rounded-3xl shadow-md sm:h-96"
          >
            <Image
              src="/chiikawa-banner-hd.jpg"
              alt="배 위에 탄 치이카와 친구들"
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover object-center"
            />
          </section>
        )}

        <div className="grid gap-6 md:grid-cols-[180px_1fr]">
          <nav aria-label="사이드 메뉴" className="h-fit rounded-3xl bg-white p-3 shadow-sm dark:bg-white/5">
            <ul className="space-y-1 text-sm">
              {BOARDS.map((b) => {
                const active = pathname.startsWith(`/board/${b.slug}`);
                return (
                  <li key={b.slug}>
                    <Link
                      href={`/board/${b.slug}`}
                      className={`block rounded-2xl px-3 py-2 hover:bg-orange-100 dark:hover:bg-white/10 ${
                        active ? "bg-orange-100 font-bold text-orange-600 dark:bg-white/10" : ""
                      }`}
                    >
                      {b.icon} {b.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs opacity-60">© 치이카와 · 팬 커뮤니티 (비공식)</footer>
    </div>
  );
}
