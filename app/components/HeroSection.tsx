import { Movie } from "../types/movie"
import Image from "next/image"

interface HeroSactionProps {
    movie: Movie
}


export default function HeroSection({ movie }: HeroSactionProps) {


    return (
        <section className="h-[480px] relative">
            <Image
                src="/banner-2.jpg"
                alt="Banner"
                fill
                className="object-cover"

            />

            <div className="absolute inset-0 bg-black/20" />

            <div className="relative mx-auto flex h-full max-w-7xl items-center gap-10 px-6 text-white">

                {/* poster image */}
                <div>
                    <Image src={movie.image} alt="Poster" width={250} height={375} className="rounded-xl border border-gray-900 shadow-2xl" />
                </div>



                {/* movie details */}

                <div className="space-y-2">
                    {/* movie title */}
                    <h1 className="text-2xl font-bold">{movie.title}</h1>

                    {/* Rating */}
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">⭐</span>

                        <span className="text-xl font-bold">
                            9.4/10
                        </span>

                        <span className="text-2xl text-gray-300">
                            (3.2K+ Votes)
                        </span>
                    </div>

                    {/* movie Info */}

                    <div className="flex items-center gap-3">

                        <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                        <span>•</span>
                        <span>{movie.genre}</span>
                        <span>•</span>
                        <span>
                            {new Date(movie.releaseDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </span>

                    </div>

                    {/* chips */}

                    <div className="flex gap-3">
                        <span className="rounded bg-gray-700 px-2 py-1 text-sm font-bold">
                            {movie.dimension}
                        </span>
                        <span className="rounded bg-gray-700 px-2 py-1 text-sm font-bold">
                            {movie.language}
                        </span>

                    </div>

                    {/* book now buttons */}

                    <button className="rounded bg-rose-600 px-14 py-3 text-md font-semibold hover:bg-rose-700 mt-5 cursor-pointer">Book Tickets</button>



                </div>



            </div>


        </section>
    )
}

