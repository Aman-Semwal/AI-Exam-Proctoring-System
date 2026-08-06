import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-8xl font-bold text-cyan-400">
          404
        </h1>

        <h2 className="text-white text-4xl font-bold mt-6">
          Page Not Found
        </h2>

        <p className="text-gray-400 mt-4">
          The page you're looking for doesn't exist.
        </p>

        <Link
          to="/"
          className="inline-block mt-10 bg-cyan-500 hover:bg-cyan-400 px-8 py-4 rounded-xl text-black font-bold transition"
        >
          Go Home
        </Link>

      </div>

    </div>
  );
};

export default NotFound;