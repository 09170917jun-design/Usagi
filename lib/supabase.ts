import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

// 환경변수가 없어도 앱이 죽지 않도록 자리표시 값으로 생성 (이때 요청은 모두 실패 처리됨)
export const supabase = createClient(url ?? "http://localhost:54321", key ?? "missing-key");
