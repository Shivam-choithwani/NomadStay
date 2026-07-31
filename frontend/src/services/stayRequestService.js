import api from "./api";

export async function createStayRequest(requestData) {
  const { data } = await api.post("/stay-requests", requestData);
  return data;
}

export async function fetchStayRequests(role = "") {
  const { data } = await api.get("/stay-requests", { params: { role } });
  return data;
}

export async function updateStayRequestStatus(requestId, status) {
  const { data } = await api.patch(`/stay-requests/${requestId}/status`, { status });
  return data;
}
