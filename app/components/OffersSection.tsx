import OffersCarousel from "./OffersCarousel";

export default function OffersSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <h2 className="mb-6 text-3xl font-bold">
        Top offers for you
      </h2>

      <OffersCarousel />
    </section>
  );
}