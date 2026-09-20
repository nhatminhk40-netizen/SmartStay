export const base44 = {
  entities: {
    Room: {
      list: async () => [],
      update: async (id, data) => data,
    }
  },
  auth: {
    loginViaEmailPassword: async (email, password) => {
      console.log('Login via email/password');
      return { access_token: 'mock-token' };
    },
    loginWithProvider: (provider, returnTo) => {
      console.log(`Login via ${provider}, return to: ${returnTo}`);
    },
    resetPasswordRequest: async (email) => {
      console.log('Reset password request for:', email);
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      console.log('Resetting password');
    },
    register: async ({ email, password }) => {
      console.log('Registering user:', email);
    },
    verifyOtp: async ({ email, otpCode }) => {
      console.log('Verifying OTP:', otpCode);
      return { access_token: 'mock-token' };
    },
    resendOtp: async (email) => {
      console.log('Resending OTP to:', email);
    },
    setToken: (token) => {
      console.log('Token set:', token);
    }
  }
};
