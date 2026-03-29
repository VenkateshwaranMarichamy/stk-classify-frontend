import axios from "axios";

const API_URL = "http://localhost:8000/api/classification/dropdown-data";
const STOCKS_URL = "http://localhost:8000/api/classification/stocks";
const BASIC_INDUSTRIES_URL = "http://localhost:8000/api/classification/basic-industries";
const PEER_YEARS_URL = "http://localhost:8000/api/fundamentals/peer-years";
const PEERS_URL = "http://localhost:8000/api/fundamentals/peers";

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

export async function fetchBasicIndustries(signal, params = {}) {
  const response = await axios.get(BASIC_INDUSTRIES_URL, {
    signal,
    params
  });
  return response.data;
}

export async function updateStockClassification(companyId, payload, signal) {
  const response = await axios.put(`${STOCKS_URL}/${companyId}`, payload, { signal });
  return response.data;
}

export async function fetchPeerYears(basicCode, signal) {
  const response = await axios.get(PEER_YEARS_URL, {
    params: { basic_ind_code: basicCode },
    signal
  });
  return response.data;
}

export async function fetchPeerFundamentals(params, signal) {
  const response = await axios.get(PEERS_URL, {
    params,
    signal
  });
  return response.data;
}
