import { Crew } from "../types/movie"
import CrewCarousel from "./CrewCarousel"

interface CastProps{
    crews: Crew[]
}






export default function crewsection({crews}:CastProps){
  return (
     <div className="mx-auto max-w-7xl px-6 py-10">

         <h2 className="text-2xl font-bold mb-4">Crew</h2>
           
           {
            crews.length >0 ?
             (<CrewCarousel crews={crews}/>)
             :(
                <p>Crew not added yet.</p>
             )



           }

         

    </div>
  )
}

