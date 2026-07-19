"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess, logout, setInitialized } from "@/app/redux/slice/authSlice";
import { restoreAuth } from "@/app/lib/auth";

export default function AuthInitializer() {
  const dispatch = useDispatch();

 useEffect(() => {

  const initialize = async () => {

    try {

      const data = await restoreAuth();

      if (data.success) {

        dispatch(
          loginSuccess({
            user: data.user,
            accessToken: data.accessToken,
          })
        );

      }

    } catch(error) {

      console.log("Refresh failed");
      dispatch(logout());

    } finally {

      dispatch(setInitialized());

    }

  };


  initialize();

}, [dispatch]);



  return null;
}