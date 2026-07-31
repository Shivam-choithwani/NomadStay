import api from "./api";

export async function createReview(reviewData) {
  const { data } = await api.post("/reviews", reviewData);
  return data;
}

export async function fetchUserReviews(userId) {
  const { data } = await api.get(`/reviews/user/${userId}`);
  return data;
}
