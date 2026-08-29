// 관리자 비밀번호입니다. Vercel 프로젝트에 ADMIN_PASSCODE 환경변수를 따로 설정하면
// 그 값을 쓰고, 설정하지 않았다면 기본값 392766을 씁니다.
const DEFAULT_ADMIN_PASSCODE = "392766";

export function isAdminAuthorized(request) {
  const required = process.env.ADMIN_PASSCODE || DEFAULT_ADMIN_PASSCODE;

  const provided = request.headers.get("x-admin-passcode") || "";
  return provided === required;
}
