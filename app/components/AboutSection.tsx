interface AboutProps{
    description: string;
}





export default function AboutSection({description}:AboutProps){

  return (
        <div className="mx-auto max-w-7xl px-6 py-10">
                    <h2 className="text-2xl font-bold text-gray-900">
                        About the movie
                    </h2>

                   <p className="mt-5 max-w-4xl leading-7 text-gray-600">
                    {description}
                    </p>
        </div>
  )
}

