"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const offers = [
  {
    icon: "/bookmyshow2.png",
    title: "Long time, no see! Here's ₹75 off*",
    subtitle: "Tap to view details",
  },
  {
    icon: "/bandhan.png",
    title: "Enjoy B1G1 Ticket Free!* with Bandhan Bank",
    subtitle: "Tap to view details",
  },
  {
    icon: "/icici.jpeg",
    title: "Get 20% instant discount with ICICI Cards",
    subtitle: "Tap to view details",
  },
  {
    icon: "/hdfc.png",
    title: "Flat ₹100 off on HDFC Credit Cards",
    subtitle: "Tap to view details",
  },
];

export default function OffersCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;

    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    updateButtons();

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

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
          {offers.map((offer, index) => (
            <div key={index} className="flex-[0_0_50%] px-2">
              <div className="flex h-20 items-center gap-3 rounded-xl border-2 border-dashed border-yellow-300 bg-[#FFF8E7] px-4">
                <Image
                  src={offer.icon}
                  alt={offer.title}
                  width={40}
                  height={40}
                  className="shrink-0 rounded-md object-contain"
                />

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-gray-800">
                    {offer.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {offer.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}