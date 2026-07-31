import api from "./api";

export async function fetchHosts(filters = {}) {
  const { data } = await api.get("/hosts", { params: filters });
  return data;
}
