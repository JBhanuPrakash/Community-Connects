import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-indigo-700">
          404
        </h1>

        <p className="mt-4 text-xl text-slate-600">
          The page you requested was not found.
        </p>

        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;