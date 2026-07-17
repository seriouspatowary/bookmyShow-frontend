const API_URL = process.env.NEXT_PUBLIC_API;


export interface Movie {
  _id: string;
  title: string;
  genre: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}


interface MovieResponse {
  success: boolean;
  data: Movie[];
}


export async function getMovies(): Promise<Movie[]> {

  const response = await fetch(
    `${API_URL}/api/movie/`
  );


  if (!response.ok) {
    throw new Error("Failed to fetch movies");
  }


  const result: MovieResponse = await response.json();


  return result.data;
}