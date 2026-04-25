import axios from "axios";

const API_URL = "http://localhost:8000/api/classification/dropdown-data";
const STOCKS_URL = "http://localhost:8000/api/classification/stocks";
const BASIC_INDUSTRIES_URL = "http://localhost:8000/api/classification/basic-industries";
const PEER_YEARS_URL = "http://localhost:8000/api/fundamentals/peer-years";
const PEERS_URL = "http://localhost:8000/api/fundamentals/peers";
const PROFILES_URL = "http://localhost:8000/api/profiles";
const STOCK_DIRECTORY_URL = "http://localhost:8000/api/stocks/active";

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

export async function fetchStockProfile(profileId, signal) {
  const response = await axios.get(`${PROFILES_URL}/${profileId}`, { signal });
  return response.data;
}

export async function patchStockProfile(profileId, payload, signal) {
  const response = await axios.patch(`${PROFILES_URL}/${profileId}`, payload, { signal });
  return response.data;
}

export async function fetchAllStocks(signal) {
  const response = await axios.get(STOCK_DIRECTORY_URL, { signal });
  return response.data;
}

const STOCK_DETAILS_URL = "http://localhost:8000/api/stocks";
const FUNDAMENTALS_URL = "http://localhost:8000/api/fundamentals/stock";

export async function fetchStockDetails(stockId, signal) {
  const response = await axios.get(`${STOCK_DETAILS_URL}/${stockId}`, { signal });
  return response.data;
}

export async function fetchStockFundamentals(stockId, signal) {
  const response = await axios.get(`${FUNDAMENTALS_URL}/${stockId}`, { signal });
  return response.data;
}

export async function fetchUnclassifiedStocks(signal) {
  const response = await axios.get(`${STOCK_DETAILS_URL}/unclassified`, { signal });
  return response.data;
}

export async function classifyStock(stockId, payload, signal) {
  const response = await axios.post(`${STOCK_DETAILS_URL}/${stockId}/classify`, payload, { signal });
  return response.data;
}

const SCREENER_URL = "http://localhost:8004/screener";

export async function fetchTechnicalIndicators(tickerId, signal) {
  const response = await axios.get(`${SCREENER_URL}/indicators/${tickerId}`, { signal });
  return response.data;
}

export async function fetchIndustryTechnicalIndicators(basicIndCode, params = {}, signal) {
  const response = await axios.get(`${SCREENER_URL}/industry/${basicIndCode}/indicators`, {
    params,
    signal
  });
  return response.data;
}
