import { ChevronDown, Menu, Search } from "lucide-react";
import Image from "next/image";

const Navbar = () => {
  return (
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
            <div className="flex items-center gap-1 cursor-pointer">
              <span>Guwahati</span>
              <ChevronDown size={18} />
            </div>

            <button className="bg-[#eb4e62] text-white px-4 py-1 rounded-md text-sm">
                Sign in
              </button>

          <Menu size={30} />
        </div>
      
  </div>
  );
};

export default Navbar;