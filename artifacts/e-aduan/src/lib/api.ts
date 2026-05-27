import {
  setBaseUrl,
  setAuthTokenGetter,
} from "@workspace/api-client-react/custom-fetch";

// In production, VITE_API_URL points to the deployed API server.
// In development on Replit, the shared proxy routes /api automatically,
// so no base URL is needed.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

// Setup token getter for the API client
setAuthTokenGetter(() => {
  return localStorage.getItem("eaduan_token");
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("eaduan_token", token);
  } else {
    localStorage.removeItem("eaduan_token");
  }
};
