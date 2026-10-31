// Shared by the auth pages (Login, Register, and any page that resumes a flow
// after sign-in, e.g. the MCP OAuth consent page). Keep the redirect
// validation in one place — it is security-sensitive and easy to drift.

// Resolve ?returnTo= to a safe same-origin path, else "/".
//
// The same-origin check alone is not enough: a value like /.//evil.com or
// /\evil.com parses same-origin but normalizes to a protocol-relative
// //evil.com when assigned to location.href — an open redirect. So require the
// resolved path to be exactly one leading slash (no "//" prefix, no backslash).
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    // Only access_token/clear_access_token are still URL-read by app-params.js, but the
    // whole bootstrap set stays stripped: one going back to a URL read must not silently
    // become injectable again. Normal app-flow params (e.g. the OAuth consent ctx) are kept.
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}

/**
 * Trả về route mặc định theo Role của user
 */
export function getDefaultRouteForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "landlord" || role === "employee") return "/chu-tro";
  return "/";
}

/**
 * Kiểm tra xem role có được phép truy cập đường dẫn path hay không
 */
export function isPathAllowedForRole(path, role) {
  if (!path || path === "/" || path.includes("/login")) return true;

  // /admin chỉ dành riêng cho role 'admin'
  if (path.startsWith("/admin")) {
    return role === "admin";
  }

  // /chu-tro và /employee chỉ dành cho landlord, employee, admin
  if (path.startsWith("/chu-tro") || path.startsWith("/employee")) {
    return ["landlord", "employee", "admin"].includes(role);
  }

  return true;
}

/**
 * Giải quyết điều hướng thông minh sau đăng nhập:
 * Nếu returnUrl hợp lệ với role thì về returnUrl; nếu không thì về trang chủ phân hệ tương ứng của role đó.
 */
export function resolvePostLoginRedirect(role, returnUrl) {
  if (returnUrl && returnUrl !== "/" && !returnUrl.includes("/login")) {
    if (isPathAllowedForRole(returnUrl, role)) {
      return returnUrl;
    }
  }
  return getDefaultRouteForRole(role);
}
