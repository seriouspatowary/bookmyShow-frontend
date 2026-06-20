"use client";

import { useState } from "react";
import { X } from "lucide-react";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({
  isOpen,
  onClose,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);

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
        <div className="mt-6 flex flex-col gap-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Enter Name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
            />
          )}

          {isSignUp && (
            <input
              type="tel"
              placeholder="Enter Phone Number"
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
            />
          )}

          <input
            type="email"
            placeholder="Enter Email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#f84464]"
          />

          <button className="w-full bg-[#f84464] text-white py-2 rounded-md cursor-pointer hover:opacity-90 transition">
            {isSignUp ? "Create Account" : "Sign In"}
          </button>
        </div>

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