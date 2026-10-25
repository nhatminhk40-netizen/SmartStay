import { base44 } from "@/api/base44Client";

export const DEFAULT_GOOGLE_CLIENT_ID = "853167094413-5vl4jeimc4gctoajgho061f64eahv76o.apps.googleusercontent.com";

// Helper lấy Client ID (ưu tiên biến môi trường, sau đó đến localStorage, và default)
export function getGoogleClientId() {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem("smartstay_google_client_id") ||
    DEFAULT_GOOGLE_CLIENT_ID
  );
}

export function setGoogleClientId(clientId) {
  if (clientId) {
    localStorage.setItem("smartstay_google_client_id", clientId.trim());
  } else {
    localStorage.removeItem("smartstay_google_client_id");
  }
}

/**
 * Tải động Google Identity Services (GIS) SDK khi cần hoặc khi trình duyệt rảnh rỗi.
 * Giúp tối ưu hóa First Contentful Paint và tránh cảnh báo bảo mật SRI / Cross-domain JS trên trang chủ.
 */
let googleScriptPromise = null;

export function loadGoogleGsiScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is not defined"));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      if (window.google?.accounts?.oauth2) return resolve(window.google);
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", () => reject(new Error("Không thể tải Google Identity Services SDK.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      googleScriptPromise = null;
      reject(new Error("Không thể kết nối đến máy chủ xác thực Google. Vui lòng kiểm tra kết nối mạng."));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

// Tự động tải nhẹ GSI trong nền khi trình duyệt rảnh rỗi (idle) để sẵn sàng khi người dùng bấm Đăng nhập
if (typeof window !== "undefined") {
  const schedulePreload = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        loadGoogleGsiScript().catch(() => {});
      });
    } else {
      setTimeout(() => {
        loadGoogleGsiScript().catch(() => {});
      }, 2000);
    }
  };

  if (document.readyState === "complete") {
    schedulePreload();
  } else {
    window.addEventListener("load", schedulePreload, { once: true });
  }
}

/**
 * Kích hoạt luồng đăng nhập Google OAuth 2.0 chính thức qua Google Identity Services (GIS).
 * Mở cửa sổ popup trực tiếp từ accounts.google.com
 */
export async function triggerGoogleSignIn({ onSuccess, onError, onPromptClientId, role, action = "login" }) {
  // 1. Đảm bảo Google SDK đã sẵn sàng
  if (typeof window === "undefined") return;
  if (!window.google?.accounts?.oauth2) {
    try {
      await loadGoogleGsiScript();
    } catch (loadErr) {
      onError?.(loadErr);
      return;
    }
  }

  // 2. Lấy Google Client ID
  let clientId = getGoogleClientId();

  // Nếu chưa có Client ID, yêu cầu người dùng cung cấp
  if (!clientId) {
    if (onPromptClientId) {
      onPromptClientId();
      return;
    }

    const userInput = window.prompt(
      "SmartStay cần Google OAuth 2.0 Client ID để liên kết trực tiếp với tài khoản Google thật của bạn.\n\nVui lòng dán Google Client ID của bạn (ví dụ: xxxxx.apps.googleusercontent.com):"
    );

    if (userInput && userInput.trim()) {
      clientId = userInput.trim();
      setGoogleClientId(clientId);
    } else {
      onError?.(new Error("Bạn chưa cấu hình Google Client ID để liên kết tài khoản."));
      return;
    }
  }

  try {
    // 3. Khởi tạo Google Token Client chính thức
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error("Google OAuth error:", tokenResponse);
          onError?.(new Error(tokenResponse.error_description || tokenResponse.error || "Người dùng đã hủy đăng nhập Google."));
          return;
        }

        try {
          const accessToken = tokenResponse.access_token;
          let userInfo = null;

          // 4. Lấy thông tin tài khoản Google
          if (accessToken) {
            try {
              const qRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(accessToken)}`);
              if (qRes.ok) {
                userInfo = await qRes.json();
              }
            } catch (qErr) {
              console.warn("Client query param fetch failed (adblock/CORS):", qErr);
            }
          }

          if (!userInfo?.email && accessToken) {
            try {
              const hRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              });
              if (hRes.ok) {
                userInfo = await hRes.json();
              }
            } catch (hErr) {
              console.warn("Client header fetch failed:", hErr);
            }
          }

          // 5. Gửi thông tin về backend SmartStay để cấp phiên JWT
          try {
            const authResult = await base44.auth.loginWithGoogle({
              access_token: accessToken,
              email: userInfo?.email,
              fullName: userInfo?.name || (userInfo?.email ? userInfo.email.split("@")[0] : undefined),
              googleId: userInfo?.sub,
              avatar: userInfo?.picture || "",
              campus: userInfo?.email?.includes("fpt") ? "FPT Can Tho" : "ĐH Cần Thơ",
              role: role || undefined,
              action: action || "login"
            });
            onSuccess?.(authResult);
            return;
          } catch (backendSyncErr) {
            console.warn("Backend loginWithGoogle error:", backendSyncErr);
            // Báo lỗi trực tiếp cho người dùng nếu backend từ chối (ví dụ: email đã đăng ký vai trò khác)
            onError?.(backendSyncErr);
            return;
          }
        } catch (globalErr) {
          console.error("Unhandled Google Auth processing error:", globalErr);
          onError?.(globalErr);
        }
      }
    });

    // 6. Mở cửa sổ popup chính thức của Google (accounts.google.com)
    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (initErr) {
    console.error("Google Token Client init error:", initErr);
    onError?.(initErr);
  }
}
