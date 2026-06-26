"use client";

import { BellRingIcon, BookmarkCheck, ChevronRight, CreditCard, GiftIcon, Info, LucideSettings, MessageCircleMoreIcon, MonitorPlayIcon, ShoppingBagIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slice/authSlice";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UserDrawer({
  isOpen,
  onClose,
}: Props) {

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
          <div className="flex justify-between items-start">

              <div>
                 <h2 className="text-xl font-bold text-gray-800">
                    Hey!
                 </h2>

                 <button className="flex items-center text-xs text-gray-600 mt-1 cursor-pointer">
                    Edit Profile
                    <ChevronRight size={15}/>
                 </button>
              </div>

            <div>
               <img src="/guest.png" alt="user"  className="h-10 w-10 rounded-full border-1 text-gray-300 mt-1"/>
            </div>
              
 
          </div>
       </div>

       {/* yellow notification */}

       <div className="bg-[#fff4d6]  border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
               <Info
                size={14}
                className="text-gray-600"
              />
              <div>
                <p className="text-sm text-gray-800 mb-1">
                  Get tickets on Whatsapp/SMS!
                </p>

                <p className="text-xs text-gray-600">
                  Add your Mobile Number
                </p>
              </div>
             
         </div>

          <ChevronRight size={20} className="text-gray-500"/>

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

      <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <ShoppingBagIcon size={18}/>
                    <div>
                        <p className="text-sm text-gray-800 mb-1">
                          Your Orders
                        </p>

                      <p className="text-xs text-gray-600">
                         View all your bookings & purchase
                      </p>

                    </div>
                      
                </div>


               <ChevronRight size={18} className="text-gray-500"/>
          </div>

      </div>


      {/* stream library */}


      <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <MonitorPlayIcon size={18}/>
                    <div>
                        <p className="text-sm text-gray-800 mb-1">
                          Stream Library
                        </p>

                      <p className="text-xs text-gray-600">
                         Rented & Purchased Movies
                      </p>

                    </div>
                      
                </div>


               <ChevronRight size={18} className="text-gray-500"/>
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

        <div className="border-b border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <LucideSettings size={18}/>

                     <div>
                         <p className="text-sm text-grey-800">Accounts & Settings</p>
                         <p className="text-xs text-gray-600">Location, Payments, Permissions & More</p>
                     </div>
                    
                  </div>

                <ChevronRight size={18} className="text-gray-500"/>
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



        

   <div className="absolute bottom-0 left-0 right-0 bg-white  border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.09)]">
        <div className="px-3  py-3 pt-4 pb-3">
          <button
            className="
              w-full
              h-12
              rounded-md
              border
              border-red-400
              bg-white
              text-red-500
              text-sm
              font-medium
              transition-colors
             cursor-pointer
            "
            onClick={()=>handleLogout()}
          >
            Sign Out
          </button>
        </div>
      </div>
         

    </div>

      
    </>
  );
}