export type Board = {
  slug: string;
  name: string;
  icon: string;
  adminOnly?: boolean;
  gallery?: boolean;
  readOnly?: boolean;
};

export const BOARDS: Board[] = [
  { slug: "notice", name: "공지사항", icon: "🐾", adminOnly: true },
  { slug: "free", name: "자유게시판", icon: "💬" },
  { slug: "popular", name: "인기글", icon: "🔥", readOnly: true },
  { slug: "qna", name: "질문/답변", icon: "❓" },
  { slug: "gallery", name: "갤러리", icon: "📷", gallery: true },
  { slug: "event", name: "이벤트", icon: "🎁", adminOnly: true },
];

export const getBoard = (slug: string) => BOARDS.find((b) => b.slug === slug);

// 데모용 관리자 계정 (클라이언트에만 존재하는 임시 인증)
export const ADMIN = { id: "admin", pw: "admin1234" };
