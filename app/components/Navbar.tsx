"use client"

import { ChevronDown, Menu, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import AuthModal from "./AuthModal";
import CityModal from "./CityModal";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux/store/store";
import UserDrawer from "./UserDrawer";


const Navbar = () => {

  const[isOpen, setIsOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


  const user = useSelector((state: RootState) => state.auth.user);

  return (
   <>
   
   <div className="h-16 flex items-center justify-between px-30">
       <div className="flex items-center gap-6">
               <Image
                src="/logo.png"
                alt="BookMyShow"
                width={90}
                height={30}
                loading="eager"
                style={{ width: 'auto', height: 'auto' }}
                />


              <div className="flex items-center gap-2 border border-gray-300 rounded-sm px-2 py-2 w-[500px] m-2">
                <Search size={18} className="text-gray-500" />
                <input
                  type="search"
                  placeholder="Search for Movies, Events, Plays..."
                  className="outline-none w-full placeholder:text-sm"
                />
              </div>
              
        </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer"
            onClick={() => setIsCityModalOpen(true)}
            >
              <span>Guwahati</span>
              <ChevronDown size={18} />
            </div>

             


              {

                user? (
                  <div className="flex items-center gap-2 cursor-pointer"
                   onClick={()=> setIsDrawerOpen(true)}>
                     <img src="/guest.png" alt="user"  className="h-8 w-8 rounded-full border-1 text-gray-300"/>
                      <span className="text-sm">
                        Hi, Guest
                      </span>
                  </div>

                ):(
                  <>

                  <button onClick={()=>setIsOpen(true)} className="bg-[#eb4e62] text-white px-4 py-1 rounded-md text-sm cursor-pointer">
                    Sign in
                 </button>
                 <Menu size={30} />
                  </>
                  
                )
              }

          
        </div>

      
  </div>

        {isOpen && (
            <AuthModal
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          )}
          {isCityModalOpen &&
            (
              <CityModal
                isOpen={isCityModalOpen}
                onClose={() => setIsCityModalOpen(false)}
              />
            ) 
          }

        
              <UserDrawer 
                isOpen= {isDrawerOpen}
                onClose={()=> setIsDrawerOpen(false)

              }/>

        
   
   </>


  
  );
};

export default Navbar;