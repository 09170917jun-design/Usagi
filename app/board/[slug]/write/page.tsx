import { notFound } from "next/navigation";
import WriteForm from "@/components/WriteForm";
import { BOARDS, getBoard } from "@/lib/boards";

export function generateStaticParams() {
  return BOARDS.filter((b) => !b.readOnly).map((b) => ({ slug: b.slug }));
}

export default async function WritePage({ params }: PageProps<"/board/[slug]/write">) {
  const { slug } = await params;
  const board = getBoard(slug);
  if (!board || board.readOnly) notFound();
  return <WriteForm slug={slug} />;
}
