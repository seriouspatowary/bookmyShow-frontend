"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function Carousel() {
  const slides = [
    "/movie1.jpg",
    "/movie2.jpeg",
    "/movie3.jpeg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = ()=>{
       setCurrentIndex((prev)=> prev === slides.length -1 ? 0: prev+1)

  }

  const prevSlide = ()=>{
       setCurrentIndex((prev)=> prev ===0 ? slides.length-1:prev-1)

  }

    useEffect(()=>{
        const timer = setInterval(()=>{
            setCurrentIndex((prev)=> prev===slides.length-1 ? 0: prev+1)
        },4000)

        return ()=> clearInterval(timer);
    },[])

  return (
    <div className="w-full">


        <div className="relative h-[300px]">
                 {
                    slides.map((slide,index)=>(
                        <img 
                         key={index}
                         src={slide} 
                         alt="movie"
                         className={`absolute inset-0 w-full h-full object-cover ${index === currentIndex ? "opacity-100":"opacity-0"}`}
                          />
                    ))
                 }
                 <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2  bg-black/50
                    hover:bg-black/70
                    text-white
                    p-3
                    rounded-full
                    shadow-lg
                    backdrop-blur-sm
                    transition-all"
                >
                    <ChevronLeft size={24}/>
                </button>

                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all"
                >
                    <ChevronRight size={24}/>
                </button>

        </div>
     
    </div>
  );
}