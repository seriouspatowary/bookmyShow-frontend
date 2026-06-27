"use client";

import { BellRingIcon, BookmarkCheck, ChevronRight, CreditCard, GiftIcon, Info, Lock, LucideSettings, MessageCircleMoreIcon, MonitorPlayIcon, ShoppingBagIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slice/authSlice";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthModal from "./AuthModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NormalDrawer({
  isOpen,
  onClose,
}: Props) {

   const[Open, setIsOpen] = useState(false);

  const dispatch = useDispatch();

  const router = useRouter();



  const handleLogout = async () => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(logout());
    onClose();
    router.push("/");
  }
};






  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300 ease-out
          ${
            isOpen
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }
        `}
      />

      <div
        className={`
          fixed top-0 right-0
          h-screen w-[380px]
          bg-white z-50
           flex flex-col
          transition-transform
          duration-500
          ease-out

          ${
            isOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >
  



       <div className="border-b border-gray-200 p-3">
          <div className="flex items-start mt-2">

              <div>
                 <h2 className="text-xl font-bold text-gray-800">
                    Hey!
                 </h2>

                
              </div>
 
          </div>
       </div>

       {/* yellow notification */}

       <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
               <div>
               <img src="/gift.jpeg" alt="user"  className="h-12 w-12 rounded-full border-1 text-gray-300 mt-1"/>
            </div>
              <div>
                <p className="text-sm text-[#747EAA] mb-1">
                  Unlock special offers &
                </p>

                <p className="text-xs text-[#747EAA]">
                  great benefits
                </p>
              </div>
             
         </div>

        <div className="">
           <button className="w-30
              h-9
              rounded-md
              border
              border-red-400
              bg-white
              text-red-500
              text-sm
              font-medium
              transition-colors
             cursor-pointer" onClick={()=>setIsOpen(true)}>Login / Register</button>
         </div>
        </div>
      </div>

      {/* notification */}


      <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <BellRingIcon size={18}/>

                 <div>
                     <p className="text-sm text-gray-800">Notifications</p>
                 </div>
            </div>
           <ChevronRight size={18} className="text-gray-500"/>

        </div>

      </div>


       {/* your oders */}

      <div className="border-b border-gray-200 bg-gray-100 opacity-90 pointer-events-none cursor-not-allowed px-4 py-4">
          <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <ShoppingBagIcon size={18} className="text-gray-400"/>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">
                          Your Orders
                        </p>

                      <p className="text-xs text-gray-400">
                         View all your bookings & purchase
                      </p>

                    </div>
                      
                </div>


               <Lock size={18} className="text-gray-400"/>
          </div>

      </div>


      {/* stream library */}


      <div className="border-b border-gray-200 bg-gray-100 opacity-90 pointer-events-none cursor-not-allowed px-4 py-4">
          <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <MonitorPlayIcon size={18} className="text-gray-400"/>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">
                          Stream Library
                        </p>

                      <p className="text-xs text-gray-400">
                         Rented & Purchased Movies
                      </p>

                    </div>
                      
                </div>


               <Lock size={18} className="text-gray-400"/>
          </div>

      </div>



      {/* credit card */}
         <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">

               <div className="flex items-center gap-3">
                   <CreditCard size={18}/>

                   <div>
                       <p className="text-sm text-gray-800 mb-1">Play Credit Card</p>
                       <p className="text-xs text-gray-600">View your Play Credit Card details and offers</p>

                   </div>


               </div>

             <ChevronRight size={18} className="text-gray-500"/>
          </div>

        </div>

        {/* Help */}

        <div className="border-b border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <MessageCircleMoreIcon size={18}/>

                     <div>
                         <p className="text-sm text-grey-800">Help & Support</p>
                         <p className="text-xs text-gray-600">View commonly asked queries and Chat</p>
                     </div>
                    
                  </div>

                <ChevronRight size={18} className="text-gray-500"/>
              </div>

        </div>



           {/* Accounts And Settings */}

        <div className="border-b border-gray-200 bg-gray-100 opacity-90 pointer-events-none cursor-not-allowed px-4 py-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <LucideSettings size={18} className="text-gray-400"/>

                     <div>
                         <p className="text-sm text-gray-400">Accounts & Settings</p>
                         <p className="text-xs text-gray-400">Location, Payments, Permissions & More</p>
                     </div>
                    
                  </div>

                <Lock size={18} className="text-gray-400"/>
              </div>

        </div>

          {/* Rewards */}
        <div className="border-b border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <GiftIcon size={18}/>

                     <div>
                         <p className="text-sm text-grey-800">Rewards</p>
                         <p className="text-xs text-gray-600">View your rewards & unlock new ones</p>
                     </div>
                    
                  </div>

                <ChevronRight size={18} className="text-gray-500"/>
              </div>

        </div>

          {/* BookAChange */}

         <div className="border-b border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <BookmarkCheck size={18}/>

                     <div>
                         <p className="text-sm text-grey-800">BookAChange</p>
                     </div>
                    
                  </div>

                <ChevronRight size={18} className="text-gray-500"/>
              </div>

        </div>



        


    </div>


     {Open && (
                <AuthModal
                  isOpen={isOpen}
                  onClose={() => setIsOpen(false)}
                />
              )}

      
    </>
  );
}