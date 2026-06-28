import Image from "next/image";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Carosal from "./components/Carosal";
import RecommendMovies from "./components/RecommendMovies";

export default function Home() {
  return (
   <>
     <Navbar/>
     <Header/>
     <Carosal/>
     <RecommendMovies/>
   </>
  );
}
