import axios from "axios";

const api = axios.create({
  baseURL: "/",
});

export const fetchStats = () => {
  console.log("fetchStats: Making API call to /products/stats");
  return api.get("/products/stats").then(res => {
    console.log("fetchStats: API response received:", res.data);
    return res.data;
  }).catch(err => {
    console.error("fetchStats: API call failed:", err);
    throw err;
  });
};

export const fetchProducts = () =>
  api.get("/products")
    .then(res => {
      console.log("API /products response:", res.data);
      return res.data.items || res.data;
    })
    .catch(err => {
      console.error("API /products error:", err);
      return [];
    });

export const fetchProductById = (id: string) => api.get(`/products/${id}`);
export const fetchComments = (productId: string) => api.get(`/products/${productId}/comments`);
export const addComment = (productId: string, comment: any) => api.post(`/products/${productId}/comments`, comment);