import api from "./api";

export async function fetchUserProfile(userId) {
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

export async function updateUserProfile(profileData) {
  const { data } = await api.put("/users/me", profileData);
  return data;
}

export async function uploadUserAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const { data } = await api.put("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function uploadGovId(file) {
  const formData = new FormData();
  formData.append("idDocument", file);

  const { data } = await api.put("/users/me/gov-id", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function sendPhoneOTP(phone) {
  const { data } = await api.post("/users/me/send-otp", { phone });
  return data;
}

export async function verifyPhoneOTP(code) {
  const { data } = await api.post("/users/me/verify-otp", { code });
  return data;
}
