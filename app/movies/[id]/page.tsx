import AboutSection from "@/app/components/AboutSection"
import CastSection from "@/app/components/CastSection"
import CrewSection from "@/app/components/CrewSection"
import HeroSection from "@/app/components/HeroSection"
import OffersSection from "@/app/components/OffersSection"
import { getMovie } from "@/app/server/movies/getMovie"

interface PageProps{
    params:Promise<{
        id:string
    }>
}


export default async function MovieDetails({params}:PageProps) {

    const {id} = await params

    const movie = await getMovie(id)

    return(
  
            <div>
                <HeroSection movie ={movie} />
                <AboutSection description ={movie.description} />
                <OffersSection />
                <CastSection casts={movie.casts} />
                <CrewSection crews={movie.crews} />
            </div>

    )
    
}