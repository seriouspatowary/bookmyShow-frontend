"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Movie } from "../types/movie"


interface HeroSectionProps {
    movie: Movie
}


export default function HeroSection({ movie }: HeroSectionProps) {

    const [open, setOpen] = useState(false)

    const router = useRouter()
    const pathname = usePathname()

    const languages = movie.language
        .split(",")
        .map((lang) => lang.trim())


    const handleSelectShow = (language: string, dimension: string) => {

        const params = new URLSearchParams({
            language,
            dimension,
        })

        router.push(`${pathname}/shows?${params.toString()}`)

    }


    return (

        <section className="relative h-[480px]">

            {/* Background Image */}

            <Image
                src="/banner-2.jpg"
                alt="Banner"
                fill
                className="object-cover"
            />


            {/* Overlay */}

            <div className="absolute inset-0 bg-black/20" />



            <div className="relative mx-auto flex h-full max-w-7xl items-center gap-10 px-6 text-white">


                {/* Poster */}

                <div>

                    <Image
                        src={movie.image}
                        alt="Poster"
                        width={250}
                        height={375}
                        className="rounded-xl border border-gray-900 shadow-2xl"
                    />

                </div>



                {/* Movie Details */}

                <div className="space-y-2">


                    {/* Title */}

                    <h1 className="text-2xl font-bold">
                        {movie.title}
                    </h1>




                    {/* Rating */}

                    <div className="flex items-center gap-3">

                        <span className="text-4xl">
                            ⭐
                        </span>


                        <span className="text-xl font-bold">
                            9.4/10
                        </span>


                        <span className="text-2xl text-gray-300">
                            (3.2K+ Votes)
                        </span>

                    </div>




                    {/* Movie Information */}

                    <div className="flex items-center gap-3">


                        <span>
                            {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                        </span>


                        <span>
                            •
                        </span>


                        <span>
                            {movie.genre}
                        </span>


                        <span>
                            •
                        </span>


                        <span>
                            {
                                new Date(movie.releaseDate)
                                    .toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })
                            }
                        </span>


                    </div>





                    {/* Movie Chips */}

                    <div className="flex gap-3">


                        <span className="rounded bg-gray-700 px-2 py-1 text-sm font-bold">

                            {movie.dimension}

                        </span>



                        <span className="rounded bg-gray-700 px-2 py-1 text-sm font-bold">

                            {movie.language}

                        </span>


                    </div>





                    {/* Book Button */}

                    <button
                        onClick={() => setOpen(true)}
                        className="mt-5 cursor-pointer rounded bg-rose-600 px-14 py-3 text-md font-semibold hover:bg-rose-700"
                    >
                        Book Tickets
                    </button>


                </div>


            </div>





            {/* Language & Format Modal — BookMyShow style */}


            {
                open && (

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">


                        <div className="w-[420px] max-h-[80vh] overflow-hidden rounded-2xl bg-white text-black shadow-2xl">


                            {/* Modal Header */}

                            <div className="flex items-start justify-between px-6 pt-6 pb-4">

                                <div>
                                    <p className="text-base text-gray-700">
                                        {movie.title}
                                    </p>

                                    <h2 className="mt-1 text-2xl font-bold">
                                        Select language and format
                                    </h2>
                                </div>

                                <button
                                    onClick={() => setOpen(false)}
                                    className="cursor-pointer text-2xl leading-none text-gray-900 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    ✕
                                </button>

                            </div>



                            {/* Languages list */}

                            <div className="max-h-[55vh] overflow-y-auto">

                                {
                                    languages.map((lang) => (

                                        <div key={lang}>

                                            {/* Language label row */}

                                            <div className="bg-gray-50 px-6 py-3">
                                                <span className="text-sm font-medium tracking-wide text-gray-500">
                                                    {lang.toUpperCase()}
                                                </span>
                                            </div>


                                            {/* Format pills row */}

                                            <div className="flex flex-wrap gap-3 border-b border-gray-100 px-6 py-4">

                                                <button
                                                    onClick={() => handleSelectShow(lang, movie.dimension)}
                                                    className="cursor-pointer rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-rose-600 hover:border-rose-500 hover:bg-rose-50"
                                                >
                                                    {movie.dimension}
                                                </button>

                                            </div>

                                        </div>

                                    ))
                                }

                            </div>



                        </div>


                    </div>

                )
            }


        </section>

    )
}