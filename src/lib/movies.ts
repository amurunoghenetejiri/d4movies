export type Movie = {
  id: string;
  title: string;
  year: number;
  rating: number;
  runtime: string;
  quality: "HD" | "4K" | "FHD";
  genres: string[];
  category: string; // hollywood, nollywood, etc.
  country: string;
  language: string;
  description: string;
  director: string;
  cast: string[];
  poster: string;
  backdrop: string;
  trending?: boolean;
  featured?: boolean;
  topRated?: boolean;
  comingSoon?: boolean;
};

const posterFor = (id: string, seed: number) =>
  `https://picsum.photos/seed/${id}-${seed}/500/750`;
const backdropFor = (id: string, seed: number) =>
  `https://picsum.photos/seed/${id}-${seed}-bg/1600/900`;

const titles = [
  ["Neon Skyline", "Hollywood"], ["Crimson Oath", "Hollywood"], ["Silent Meridian", "Hollywood"],
  ["Eclipse Protocol", "Hollywood"], ["The Last Cartographer", "Hollywood"], ["Velvet Static", "Hollywood"],
  ["Ashes of Andromeda", "Hollywood"], ["Ironveil", "Hollywood"], ["Paper Kingdoms", "Hollywood"],
  ["Ghost Frequency", "Hollywood"],
  ["Lagos After Dark", "Nollywood"], ["The Bride Price", "Nollywood"], ["Owerri Nights", "Nollywood"],
  ["Iyanu", "Nollywood"], ["The Governor's Daughter", "Nollywood"], ["Broken Calabash", "Nollywood"],
  ["Sons of Benin", "Nollywood"], ["Palace of Whispers", "Nollywood"],
  ["Monsoon Heart", "Bollywood"], ["Delhi Diaries", "Bollywood"], ["Raja & Roshni", "Bollywood"],
  ["The Mumbai Line", "Bollywood"], ["Chandni Rooftops", "Bollywood"], ["Kesari Sky", "Bollywood"],
  ["Seoul Encoded", "Korean Drama"], ["My Neighbor the Ghost", "Korean Drama"], ["Winter in Busan", "Korean Drama"],
  ["The Cafe on Jeju", "Korean Drama"], ["Signal 404", "Korean Drama"],
  ["Shanghai Mirage", "Chinese Drama"], ["The Ink Painter", "Chinese Drama"], ["Nine Lanterns", "Chinese Drama"],
  ["Peach Blossom Vow", "Chinese Drama"],
  ["Chronoblade", "Anime"], ["Starforge Academy", "Anime"], ["The Kitsune Contract", "Anime"],
  ["Neon Samurai", "Anime"], ["Astral Bakery", "Anime"], ["Depths of Miroku", "Anime"],
  ["The Cartographer's Wife", "TV Series"], ["Undertow", "TV Series"], ["Signal Grid", "TV Series"],
  ["House of Ember", "TV Series"], ["Blackwater Bay", "TV Series"], ["The Understudy", "TV Series"],
];

const genrePool = [
  "Action", "Adventure", "Comedy", "Drama", "Romance", "Sci-Fi",
  "Fantasy", "Crime", "Animation", "Documentary", "Family", "Thriller", "Mystery", "Horror",
];

const countries: Record<string, string> = {
  Hollywood: "United States",
  Nollywood: "Nigeria",
  Bollywood: "India",
  "Korean Drama": "South Korea",
  "Chinese Drama": "China",
  Anime: "Japan",
  "TV Series": "United Kingdom",
};

const langs: Record<string, string> = {
  Hollywood: "English",
  Nollywood: "English",
  Bollywood: "Hindi",
  "Korean Drama": "Korean",
  "Chinese Drama": "Mandarin",
  Anime: "Japanese",
  "TV Series": "English",
};

function makeMovie(i: number): Movie {
  const [title, cat] = titles[i % titles.length];
  const id = `${cat.toLowerCase().replace(/\s/g, "-")}-${i + 1}`;
  const year = 2019 + ((i * 3) % 8);
  const rating = +(6.5 + ((i * 7) % 35) / 10).toFixed(1);
  const rmin = 82 + ((i * 11) % 60);
  const runtime = `${Math.floor(rmin / 60)}h ${rmin % 60}m`;
  const genres = [genrePool[i % genrePool.length], genrePool[(i * 3 + 2) % genrePool.length]];
  const q: Movie["quality"] = ["4K", "HD", "FHD", "HD"][i % 4] as Movie["quality"];
  return {
    id,
    title,
    year,
    rating,
    runtime,
    quality: q,
    genres,
    category: cat,
    country: countries[cat] ?? "Global",
    language: langs[cat] ?? "English",
    description:
      `${title} follows a bold journey through ${genres[0].toLowerCase()} and ${genres[1].toLowerCase()}. ` +
      `A cinematic story rich in atmosphere, emotion, and unforgettable characters — crafted for the D4TECH audience.`,
    director: ["Ava Duvernay", "Bong Joon-ho", "Kunle Afolayan", "Zoya Akhtar", "Makoto Shinkai", "Denis Villeneuve"][i % 6],
    cast: ["Idris Elba", "Zendaya", "Genevieve Nnaji", "Deepika Padukone", "Song Kang", "Chris Evans", "Lupita Nyong'o"].slice(0, 4 + (i % 3)),
    poster: posterFor(id, i + 1),
    backdrop: backdropFor(id, i + 1),
    trending: i % 5 === 0,
    featured: i < 6,
    topRated: rating > 8.5,
    comingSoon: i % 11 === 0 && year >= 2025,
  };
}

export const movies: Movie[] = Array.from({ length: 48 }, (_, i) => makeMovie(i));

export const findMovie = (id: string) => movies.find((m) => m.id === id);

export const filterByCategory = (cat: string) =>
  movies.filter((m) => m.category.toLowerCase() === cat.toLowerCase());

export const allGenres = Array.from(new Set(movies.flatMap((m) => m.genres))).sort();
export const allCountries = Array.from(new Set(movies.map((m) => m.country))).sort();
