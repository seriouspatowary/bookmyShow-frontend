import React from 'react'

export default function Header(){

  return (
 
          <div className="h-12 flex items-center justify-between bg-[#f5f5f5] px-30 text-xs">

              <div className="left flex items-center gap-5">
                 <div className="flex items-center gap-1"><span>Movies</span></div>
                  
                 <div className="flex items-center gap-1"><span>Stream</span></div>

                 <div className="flex items-center gap-1"><span>Events</span></div>

                 <div className="flex items-center gap-1"><span>Plays</span></div>
                  <div className="flex items-center gap-1"><span>Sports</span></div>

                  <div className="flex items-center gap-1"><span>Activities</span></div>
               
              </div>


              <div className="flex items-center gap-6 ">
                 <div className="flex items-center gap-1"><span>ListYourShow</span></div>
                  
                 <div className="flex items-center gap-1"><span>Corporates</span></div>

                 <div className="flex items-center gap-1"><span>Offers</span></div>

                 <div className="flex items-center gap-1"><span>Gift Cards</span></div>

              </div>

          </div>
   
  )
}

