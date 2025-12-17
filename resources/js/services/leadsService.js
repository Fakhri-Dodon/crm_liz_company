import axios from "./axios";

export default {
  getAll: () => axios.get("/leads"),
  create: (data) => axios.post("/leads", data),
  update: (id, data) => axios.put(`/leads/${id}`, data),
  delete: (id) => axios.delete(`/leads/${id}`),
};
