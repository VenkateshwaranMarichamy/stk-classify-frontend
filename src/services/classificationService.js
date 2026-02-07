import axios from "axios";

const API_URL = "http://localhost:8000/api/classification/dropdown-data";

export async function fetchClassificationData(signal) {
  const response = await axios.get(API_URL, { signal });
  return response.data;
}
