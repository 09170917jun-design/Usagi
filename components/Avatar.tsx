import type { User } from "@/lib/store";

/** 프로필 사진. 사진이 없으면 이름 첫 글자를 보여준다. */
export default function Avatar({ user, size = 32 }: { user: NonNullable<User>; size?: number }) {
  const box = { width: size, height: size };
  if (user.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 카카오 등 외부 도메인 이미지라 next/image 설정 없이 사용
      <img
        src={user.avatar}
        alt={`${user.name} 프로필 사진`}
        referrerPolicy="no-referrer"
        style={box}
        className="rounded-full border border-orange-200 object-cover"
      />
    );
  }
  return (
    <span
      style={{ ...box, fontSize: size * 0.45 }}
      className="flex items-center justify-center rounded-full bg-orange-300 font-bold text-white"
      aria-hidden
    >
      {user.name.slice(0, 1)}
    </span>
  );
}
