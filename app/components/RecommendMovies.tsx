"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import MovieCard from "./MovieCard";

const movies = [
  {
    id: 1, title: "Cocktail 2",
    genre: "Comedy/Drama/Romantic", image: "./movie1.webp",
  },
  { id: 2, title: "Welcome To The Jungle", genre: "Action/Comedy", image: "./movie2.webp", },
  { id: 3, title: "Chupa Chupi", genre: "Comedy/Drama/Mystery", image: "./movie3.webp", },
  { id: 4, title: "Main Vapas Aaunga", genre: "Drama/Period/Romantic", image: "./movie4.webp" },
  {
    id: 5, title: "Supergirl", genre: "Action/Adventure/Sci-Fi", rating: "8.2/10", votes: "12.3K Votes", image: "./movie5.webp"
  },
  { id: 6, title: "Welcome To The Jungle", genre: "Action/Comedy", rating: "8.2/10", votes: "12.3K Votes", image: "./movie6.webp" },
  { id: 7, title: "Welcome To The Jungle", genre: "Action/Comedy", rating: "8.2/10", votes: "12.3K Votes", image: "./movie7.webp" },
  { id: 8, title: "Welcome To The Jungle", genre: "Action/Comedy", rating: "8.2/10", votes: "12.3K Votes", image: "./movie8.webp" },];

export default function RecommendMovies() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateButtons();

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <section className="mx-auto max-w-7xl py-10">
      <h2 className="mb-6 text-2xl font-bold">
        Recommended Movies
      </h2>

      <div className="relative">
        {/* Left Arrow */}
        {canScrollPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute -left-5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-800 text-white p-3 shadow-lg hover:bg-gray-700"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute -right-5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-gray-800 text-white p-3 shadow-lg hover:bg-gray-700"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Slider */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="flex-[0_0_20%] px-3"
              >
                <MovieCard {...movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}