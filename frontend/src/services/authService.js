import api from "./api";

export async function registerUser({ name, email, password }) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data; // { accessToken, user }
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { accessToken, user }
}

export async function logoutUser() {
  await api.post("/auth/logout");
}

// Called once on app load — uses the httpOnly refresh cookie to silently
// re-authenticate without asking the user to log in again.
export async function refreshSession() {
  const { data } = await api.post("/auth/refresh");
  return data; // { accessToken }
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data; // user object
}

export const verifyEmail = async (token) => {
  const { data } = await api.get(`/auth/verify-email/${token}`);
  return data;
};

export const resendVerificationEmail = async () => {
  const { data } = await api.post("/auth/resend-verification");
  return data;
};

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
}
