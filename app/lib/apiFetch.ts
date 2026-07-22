
import { loginSuccess, logout } from "../redux/slice/authSlice";
import { store } from "../redux/store/store";
import { restoreAuth } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let accessToken = store.getState().auth.accessToken;

  const makeRequest = async (token: string | null) => {
    return fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      credentials: "include",
    });
  };

  let response = await makeRequest(accessToken);

  if (response.status === 403) {
    const data = await response.json();

    if (data.code === "TOKEN_EXPIRED") {
      const refresh = await restoreAuth();

      if (!refresh.success) {
        store.dispatch(logout());
        throw new Error("Session expired");
      }

      store.dispatch(
        loginSuccess({
          user: refresh.user,
          accessToken: refresh.accessToken,
        })
      );

      response = await makeRequest(refresh.accessToken);
    }
  }

  return response;
}