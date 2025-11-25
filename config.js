const BACKEND_BASE_URL = "https://backend.raml.elhlwgy.com/";
const LOCALHOST_BASE_URL = "http://localhost:8000/";

// Toggle environment here
//const BASE_URL = LOCALHOST_BASE_URL; 
const BASE_URL = BACKEND_BASE_URL;

export const API = {
  UPLOAD: `${BASE_URL}api/analysis/upload`,
  REPORTS: `${BASE_URL}api/analysis/reports`,
  DOWNLOAD_REPORT: `${BASE_URL}api/analysis/report`, // <-- added
  USER: `${BASE_URL}api/user`
};
