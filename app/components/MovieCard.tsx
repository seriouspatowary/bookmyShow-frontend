type Props = {
  title: string;
  genre: string;
  image: string;
};

const MovieCard = ({
  title,
  genre,
  image,
}: Props) => {
  return (
    <div className="w-60 flex-shrink-0 cursor-pointer">
      <img
        src={image}
        alt={title}
        className="h-[380px] w-full rounded-xl object-cover"
      />

      <h3 className="mt-3 text-lg font-semibold line-clamp-2">
        {title}
      </h3>

      <p className="text-gray-500 text-md line-clamp-2">
        {genre}
      </p>
    </div>
  );
};

export default MovieCard;