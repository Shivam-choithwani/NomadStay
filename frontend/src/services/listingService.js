import api from "./api";

export async function fetchListings(filters = {}) {
  const { data } = await api.get("/listings", { params: filters });
  return data;
}

export async function fetchListingById(id) {
  const { data } = await api.get(`/listings/${id}`);
  return data;
}

export async function createListing(listingData) {
  const { data } = await api.post("/listings", listingData);
  return data;
}

export async function updateListing(id, listingData) {
  const { data } = await api.put(`/listings/${id}`, listingData);
  return data;
}

export async function deleteListing(id) {
  const { data } = await api.delete(`/listings/${id}`);
  return data;
}

export async function fetchRagListings(filters = {}) {
  const { data } = await api.get("/listings/rag-search", { params: filters });
  return data;
}
