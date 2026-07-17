"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import MovieCard from "./MovieCard";
import { useRouter } from "next/navigation";


type Movie = {
  _id: string;
  title: string;
  genre: string;
  image: string;
};


type Props = {
  movies: Movie[];
};


export default function MovieCarousel({
  movies,
}: Props) {

  const router = useRouter();


  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });


  const [canScrollPrev, setCanScrollPrev] =
    useState(false);


  const [canScrollNext, setCanScrollNext] =
    useState(false);



  useEffect(() => {

    if (!emblaApi) return;


    const updateButtons = () => {

      setCanScrollPrev(
        emblaApi.canScrollPrev()
      );


      setCanScrollNext(
        emblaApi.canScrollNext()
      );

    };


    updateButtons();


    emblaApi.on(
      "select",
      updateButtons
    );


    emblaApi.on(
      "reInit",
      updateButtons
    );


    return () => {

      emblaApi.off(
        "select",
        updateButtons
      );


      emblaApi.off(
        "reInit",
        updateButtons
      );

    };


  }, [emblaApi]);



  return (

    <div className="relative">


      {canScrollPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute -left-5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-800 text-white p-3 shadow-lg hover:bg-gray-700"
        >
          <ChevronLeft size={22} />
        </button>
      )}



      {canScrollNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="absolute -right-5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-800 text-white p-3 shadow-lg hover:bg-gray-700"
        >
          <ChevronRight size={22} />
        </button>
      )}



      <div
        className="overflow-hidden"
        ref={emblaRef}
      >

        <div className="flex">

          {movies.map((movie) => (

            <div
              key={movie._id}
              className="flex-[0_0_20%] px-3"
              onClick={()=>router.push(`/movies/${movie._id}`)}
            >

              <MovieCard
                title={movie.title}
                genre={movie.genre}
                image={movie.image}
              />

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}