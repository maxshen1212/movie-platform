import React from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import { useState, useEffect } from "react";
import { useDebounce } from "react-use";
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

// API configuration
const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

//主應用元件
const App = () => {
  //狀態管理
  // 使用 useState 管理關鍵字、電影列表、錯誤訊息、載入狀態和熱門電影列表。
  // 使用 useDebounce 來避免過多的 API 調用。
  // 當關鍵字改變時，會觸發useDebounce的搜尋詞更新，並根據關鍵字或熱門電影來獲取電影列表。
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);

  // 使用 useDebounce 來延遲搜尋詞的更新，避免過多的 API 調用。
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 400, [searchTerm]);

  // 獲取電影列表的方法
  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}
        `
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPPTIONS);
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      const data = await response.json();
      console.log(data);
      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        // Update the search count in Appwrite database.
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.log(`Error fetching movies ${error}`);
      setErrorMessage("Error fetching movies");
    } finally {
      setIsLoading(false);
    }
  };

  // 獲取熱門電影列表的方法
  const fetchTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  };

  // 1. 當組件mount時，會獲取電影列表。
  // 2. 當搜尋詞改變時，會獲取電影列表。
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // 當組件mount時，會獲取熱門電影列表。
  useEffect(() => {
    fetchTrendingMovies();
  }, [debouncedSearchTerm]);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without The Hassle
          </h1>
          {/* 搜尋元件 */}
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {/* 條件渲染熱門電影 */}
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img
                    src={movie.poster_url || "no-movie.png"}
                    alt={movie.title}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="all-movies">
          <h2 className="mb-[20px]">All Movies</h2>
          {/* 條件渲染載入圈圈、錯誤訊息和電影列表元件 */}
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
