export interface Cast {
  _id: string;
  movieId: string;
  name: string;
  character: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface Crew {
  _id: string;
  movieId: string;
  name: string;
  role: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  _id: string;
  title: string;
  genre: string;
  image: string;
  description: string;
  dimension: string;
  duration: number;
  language: string;
  releaseDate: string;
  createdAt: string;
  updatedAt: string;
  casts: Cast[];
  crews: Crew[];
}