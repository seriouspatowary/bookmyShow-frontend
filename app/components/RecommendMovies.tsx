import MovieCarousel from "./MovieCarousel";


export default async function RecommendMovies() {

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/api/movie/public`,
    {
      cache: "no-store",
    }
  );


  const result = await response.json();
  const movies = result.movies;


  return (
    <section className="mx-auto max-w-7xl py-10">

      <h2 className="mb-6 text-2xl font-bold">
        Recommended Movies
      </h2>


         <MovieCarousel movies={movies} />

    </section>
  );
}