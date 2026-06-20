 "use client"
 
 import {
  Building2,
  Landmark,
  House,
  Church,
  LocateFixed, Search
  
} from "lucide-react";
import { useState } from "react";


type CityModalProps= {
     isOpen: boolean;
     onClose:()=> void;
}


export default function CityModal({isOpen,onClose}:CityModalProps){

      const [showAllCities, setShowAllCities] = useState(false);

 
const cities = [
  { name: "Mumbai", Icon: Building2 },
  { name: "Delhi-NCR", Icon: Landmark },
  { name: "Bengaluru", Icon: Building2 },
  { name: "Hyderabad", Icon: Church },
  { name: "Chandigarh", Icon: House },
  { name: "Ahmedabad", Icon: Landmark },
  { name: "Pune", Icon: Building2 },
  { name: "Chennai", Icon: Church },
  { name: "Kolkata", Icon: Landmark },
  { name: "Kochi", Icon: Landmark },
];

const otherCities = [
   "Mumbai" ,
   "Delhi-NCR",
   "Bengaluru", 
   "Hyderabad", 
   "Chandigarh", 
   "Ahmedabad", 
   "Pune",
   "Chennai", 
   "Kolkata",
   "Kochi",
   "Mumbai" ,
   "Delhi-NCR",
   "Bengaluru", 
   "Hyderabad", 
   "Chandigarh", 
   "Ahmedabad", 
   "Pune",
   "Chennai", 
   "Kolkata",
   "Kochi",
   "Mumbai" ,
   "Delhi-NCR",
   "Bengaluru", 
   "Hyderabad", 
   "Chandigarh", 
   "Ahmedabad", 
   "Pune",
   "Chennai", 
   "Kolkata",
   "Kochi",
   "Mumbai" ,
   "Delhi-NCR",
   "Bengaluru", 
   "Hyderabad", 
   "Kochi",
];

    if(!isOpen) return null;

    return(
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-15 z-50"
          onClick={onClose}>
             <div
                    className="bg-white w-[62%] max-w-6xl rounded-lg overflow-hidden min-h-[250px]"
                    onClick={(e) => e.stopPropagation()}
                >
                 <div className="p-4 pt-4 pb-1">
                    <div className="flex items-center border border-gray-300 rounded-md px-4 h-14">
                        <Search size={20} className="text-gray-500" />

                        <input
                            type="text"
                            placeholder="Search for your city"
                            className="flex-1 ml-3 outline-none text-md"
                        />
                    </div>
                    
                 </div>

                 <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 text-red-400 text-sm">
                      <LocateFixed/>
                      <span> Detect my location</span>
                 </div>

                 <div className="pt-4 pb-2">
                    <div className="text-center text-gray-600 text-sm">
                        Popular Cities
                    </div>
                </div>

                <div className="pt-4 pb-2 p-6">
                    <div className="flex items-center justify-between">
                      {
                        cities.map((city,idx)=>(
                          <div key={idx}
                           className="flex flex-col items-center cursor-pointer">
                               <city.Icon
                                size={24}
                                className="text-gray-500"
                                />
                               <span className="text-sm mt-2 text-gray-600">{city.name}</span>

                          </div>

                        ))
                      }
                    </div>
                </div>

               
                {
                    !showAllCities ?
                    (
                        <>

                         <div className="pt-4 mb-4">
                            <div onClick={()=>setShowAllCities(true)} className="text-center text-sm text-red-400 cursor-pointer">
                                View All Cities
                            </div>
                        </div>
                        </>
                    ): (

                     <div className="px-10 pt-6 pb-8">
                          <h3 className="text-center text-sm mb-10 text-gray-700">
                             Other Cities
                         </h3>

                          <div className="grid grid-cols-5 gap-y-2">
                          {otherCities.map((city, index) => (
                                <div
                                key={index}
                                className="text-gray-500 text-xs cursor-pointer hover:text-black"
                                >
                                {city}
                                </div>
                            ))}
                            </div>

                            <div
                            className="text-center text-red-500 text-sm mt-8 cursor-pointer"
                            onClick={() => setShowAllCities(false)}
                            >
                               Hide all cities
                            </div>
                        </div>
                    )
                }


            </div>


        </div>
    )


}