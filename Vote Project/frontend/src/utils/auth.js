export function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
    // หมายเหตุ: atob ใช้ได้ในเบราว์เซอร์; ถ้า SSR ต้องใช้วิธีอื่น
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= decoded.exp;
}
