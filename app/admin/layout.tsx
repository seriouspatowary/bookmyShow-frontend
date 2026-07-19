"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthInitializer from "../AuthInitializer";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();

  const { user, isAuthenticated , initialized} = useSelector(
    (state:any)=>state.auth
  );


  useEffect(()=>{

     if(!initialized) return;

    if(!isAuthenticated){
      router.replace("/login");
      return;
    }

    if(user?.role !== "administrator"){
      router.replace("/");
    }

  },[user,isAuthenticated, initialized, router]);


if(!initialized){
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="
          w-12 h-12
          border-4
          border-red-200
          border-t-[#f84464]
          rounded-full
          animate-spin
        "
      ></div>
    </div>
  );
}

  if(!isAuthenticated || user?.role !== "administrator"){
    return null;
  }


  return (
    <>
      {children}
    </>
  );
}