// ADMIN_PASSCODE 환경변수가 설정된 경우에만 관리자 기능(주문 목록 조회/초기화)에
// 비밀번호를 요구합니다. 설정하지 않으면 별도 인증 없이 누구나 접근할 수 있습니다.
export function isAdminAuthorized(request) {
  const required = process.env.ADMIN_PASSCODE;
  if (!required) return true;

  const provided = request.headers.get("x-admin-passcode") || "";
  return provided === required;
}
