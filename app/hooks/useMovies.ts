import { useQuery } from "@tanstack/react-query";
import { getMovies } from "@/app/services/movie";


export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: getMovies,
  });
}