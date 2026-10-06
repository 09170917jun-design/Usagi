import { notFound } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import { getBoard } from "@/lib/boards";

export default async function PostPage({ params }: PageProps<"/board/[slug]/[id]">) {
  const { slug, id } = await params;
  if (!getBoard(slug)) notFound();
  return <PostDetail slug={slug} id={id} />;
}
