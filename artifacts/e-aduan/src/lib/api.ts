import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

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
