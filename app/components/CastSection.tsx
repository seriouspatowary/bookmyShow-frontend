import { Cast } from "../types/movie"
import CastCarousel from "./CastCarousel"

interface CastProps{
    casts: Cast[]
}






export default function CastSection({casts}:CastProps){
  return (
     <div className="mx-auto max-w-7xl px-6 py-10">

         <h2 className="text-2xl font-bold mb-4">Cast</h2>
           
           {
            casts.length >0 ?
             (<CastCarousel casts={casts}/>)
             :(
                <p>Cast not added yet.</p>
             )



           }

         

    </div>
  )
}

