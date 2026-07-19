"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../redux/slice/authSlice";
import { access } from "fs";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({
  isOpen,
  onClose,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
 

// 1. Handle Registration Logic
  const handleRegistration = async () => {
    try {

      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        setIsSignUp(false); // Switch to Sign In after successful registration
      }
    } catch (error) {
      console.error("Registration error:", error);
    }finally{
      setLoading(false);
    }
  };

  // 2. Handle Login Logic
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

       if (!data.success) {
          alert(data.message);
          return;
       }

     
        dispatch(logout());
        dispatch(loginSuccess({
            user:data.user,
            accessToken : data.accessToken
        }));
        onClose();
    } catch (error) {
      console.error("Login error:", error);
    }finally{
      setLoading(false);
    }
  };

  // 3. Conditional Master Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents page reload for both login and signup
    
    if (isSignUp) {
      await handleRegistration();
    } else {
      await handleLogin();
    }
  };



  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[500px] rounded-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h2>

          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-black"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {isSignUp && (
            <input
              type="text"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder="Enter Name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
            />
          )}

          {isSignUp && (
            <input
              type="tel"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
              placeholder="Enter Phone Number"
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
            />
          )}

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
          />

          <button
           className="w-full bg-[#f84464] text-white py-2 rounded-md cursor-pointer hover:opacity-90 transition"
           disabled={loading}
           >
            { loading ? isSignUp ? "Creating...": "Signing In...":  isSignUp? "Create Account": "Sign In"}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-5 text-center text-sm">
          { isSignUp ? (
            <> 
                 Already have an account?{" "}
                 <button onClick={()=>setIsSignUp(false)}
                    className="text-[#f84464] font-medium cursor-pointer">
                     Sign In
                 </button>
              
            </>
          ):(
            <>
              Don't have an account?{" "}
            
             <button onClick={()=>setIsSignUp(true)}
                    className="text-[#f84464] font-medium cursor-pointer">
                     Sign Up
            </button>
            
            </>

          )

          }
        </div>
      </div>
    </div>
  );
}