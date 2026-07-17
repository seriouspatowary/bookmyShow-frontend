"use client"
import { useCallback, useEffect, useState } from "react"
import { Cast } from "../types/movie"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CastProps {
    casts: Cast[]
}

export default function CastCarousel({ casts }: CastProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        loop: false,
    })

    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)


    const updateButtons = useCallback(() => {
        if (!emblaApi) return

        setCanScrollPrev(emblaApi.canScrollPrev())
        setCanScrollNext(emblaApi.canScrollNext())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return

        updateButtons()

        emblaApi.on("select", updateButtons)
        emblaApi.on("reInit", updateButtons)

        return () => {
            emblaApi.off("select", updateButtons)
            emblaApi.off("reInit", updateButtons)
        }
    }, [emblaApi, updateButtons])

    return (
        <div className="relative">

                {/* Previous */}
                {canScrollPrev && (
                    <button
                    onClick={() => emblaApi?.scrollPrev()}
                    className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition hover:bg-gray-700"
                    >
                    <ChevronLeft size={20} />
                    </button>
                )}

                {/* Next */}
                {canScrollNext && (
                    <button
                    onClick={() => emblaApi?.scrollNext()}
                    className="absolute right-0 top-1/2 z-20 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition hover:bg-gray-700"
                    >
                    <ChevronRight size={20} />
                    </button>
                )}


            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {casts.map((cast) => (
                        <div
                            key={cast._id}
                            className="flex-[0_0_16.66%] px-3"
                        >
                            <div>
                                {/* Image */}
                                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-200">
                                    <img
                                        src={cast.image}
                                        alt={cast.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Name */}
                                <h3 className="mt-3 text-[15px] font-semibold text-gray-900 leading-tight truncate">
                                    {cast.name}
                                </h3>

                                {/* Character */}
                                <p className="mt-1 text-[14px] text-gray-500 truncate">
                                    as {cast.character}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}