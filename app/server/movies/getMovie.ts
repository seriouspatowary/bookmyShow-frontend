import { Movie } from "@/app/types/movie";


export async function getMovie(id: string): Promise<Movie> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API}/api/movie/getbyid/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch movie");
  }

  const data = await res.json();

  return data.movie;
}