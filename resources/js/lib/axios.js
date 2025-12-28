import axios from "axios";

const instance = axios.create({
  baseURL: "/",
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

export default instance;