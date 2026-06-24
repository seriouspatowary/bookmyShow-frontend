"use client";

import { Provider } from "react-redux";
import { store } from "@/app/redux/store/store";
import AuthInitializer from "./AuthInitializer";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer/>
      {children}
    </Provider>
  );
}