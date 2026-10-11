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
 * Kích hoạt luồng đăng nhập Google OAuth 2.0 chính thức qua Google Identity Services (GIS).
 * Mở cửa sổ popup trực tiếp từ accounts.google.com
 */
export async function triggerGoogleSignIn({ onSuccess, onError, onPromptClientId }) {
  // 1. Kiểm tra Google SDK đã tải xong chưa
  if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
    const errorMsg = "Google Identity Services SDK chưa được tải xong. Vui lòng thử lại sau vài giây.";
    onError?.(new Error(errorMsg));
    return;
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
          // 4. Lấy thông tin tài khoản Google thật trực tiếp từ máy chủ Google API
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          });

          if (!userInfoRes.ok) {
            throw new Error("Không thể lấy thông tin từ Google API.");
          }

          const userInfo = await userInfoRes.json();

          if (!userInfo.email) {
            throw new Error("Tài khoản Google không cung cấp địa chỉ email hợp lệ.");
          }

          // 5. Gửi thông tin tài khoản thật về backend SmartStay để cấp phiên JWT
          const authResult = await base44.auth.loginWithGoogle({
            email: userInfo.email,
            fullName: userInfo.name || userInfo.email.split("@")[0],
            googleId: userInfo.sub,
            avatar: userInfo.picture || "",
            campus: userInfo.email.includes("fpt") ? "FPT Can Tho" : "ĐH Cần Thơ"
          });

          onSuccess?.(authResult);
        } catch (fetchErr) {
          console.error("Lỗi đồng bộ tài khoản Google với SmartStay:", fetchErr);
          onError?.(fetchErr);
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
