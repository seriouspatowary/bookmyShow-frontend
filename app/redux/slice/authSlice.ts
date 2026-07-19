import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {

    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },

    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },

    setInitialized: (state) => {
      state.initialized = true;
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },

  },
});


export const {
  loginSuccess,
  logout,
  setAccessToken,
  setInitialized,
} = authSlice.actions;


export default authSlice.reducer;