import axios from "axios";

const API_URL = "http://localhost:8000/api/classification/dropdown-data";
const STOCKS_URL = "http://localhost:8000/api/classification/stocks";
const BASIC_INDUSTRIES_URL = "http://localhost:8000/api/classification/basic-industries";

export async function fetchClassificationData(signal) {
  const response = await axios.get(API_URL, { signal });
  return response.data;
}

export async function fetchStocksByBasicCode(basicCode, signal) {
  const response = await axios.get(STOCKS_URL, {
    params: { basic_ind_code: basicCode },
    signal
  });
  return response.data;
}

export async function fetchBasicIndustries(signal) {
  const response = await axios.get(BASIC_INDUSTRIES_URL, { signal });
  return response.data;
}

export async function updateStockClassification(companyId, payload, signal) {
  const response = await axios.put(`${STOCKS_URL}/${companyId}`, payload, { signal });
  return response.data;
}
