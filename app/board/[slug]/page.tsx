import { notFound } from "next/navigation";
import BoardView from "@/components/BoardView";
import { BOARDS, getBoard } from "@/lib/boards";

export function generateStaticParams() {
  return BOARDS.map((b) => ({ slug: b.slug }));
}

export default async function BoardPage({ params }: PageProps<"/board/[slug]">) {
  const { slug } = await params;
  if (!getBoard(slug)) notFound();
  return <BoardView slug={slug} />;
}
