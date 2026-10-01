import { createMovie } from "./schema.js";

const movieSeeds = [
  ["Metropolis",1927,["sci-fi","silent"],["metropolis","fritz lang","1927"]],
  ["Nosferatu",1922,["horror","silent"],["nosferatu","nosferatu the vampyre","1922"]],
  ["The General",1926,["comedy","silent"],["the general","buster keaton","1926"]],
  ["Sherlock Jr.",1924,["comedy","silent"],["sherlock jr","sherlock junior","buster keaton","1924"]],
  ["Safety Last!",1923,["comedy","silent"],["safety last","harold lloyd","1923"]],
  ["The Kid",1921,["comedy","drama"],["the kid","charlie chaplin","1921"]],
  ["The Gold Rush",1925,["comedy","silent"],["the gold rush","charlie chaplin","1925"]],
  ["A Trip to the Moon",1902,["fantasy","silent"],["a trip to the moon","le voyage dans la lune","georges melies","1902"]],
  ["The Cabinet of Dr. Caligari",1920,["horror","silent"],["the cabinet of dr caligari","das cabinet des dr caligari","1920"]],
  ["Night of the Living Dead",1968,["horror"],["night of the living dead","george romero","1968"]],
  ["Carnival of Souls",1962,["horror"],["carnival of souls","1962"]],
  ["His Girl Friday",1940,["comedy","romance"],["his girl friday","1940"]],
  ["Detour",1945,["crime","film noir"],["detour","edgar g ulmer","1945"]],
  ["D.O.A.",1949,["crime","film noir"],["d o a","doa","1949"]],
  ["The Stranger",1946,["crime","film noir"],["the stranger","orson welles","1946"]],
  ["House on Haunted Hill",1959,["horror"],["house on haunted hill","1959"]],
  ["The Little Shop of Horrors",1960,["horror","comedy"],["little shop of horrors","the little shop of horrors","1960"]],
  ["Plan 9 from Outer Space",1959,["sci-fi","horror"],["plan 9 from outer space","ed wood","1959"]],
  ["The Last Man on Earth",1964,["horror","sci-fi"],["the last man on earth","vincent price","1964"]],
  ["The Most Dangerous Game",1932,["adventure","thriller"],["the most dangerous game","1932"]],
  ["Scarlet Street",1945,["crime","film noir"],["scarlet street","1945"]],
  ["The Big Sleep",1946,["crime","film noir"],["the big sleep","1946"]],
  ["The Public Enemy",1931,["crime","drama"],["the public enemy","1931"]],
  ["Little Caesar",1931,["crime","drama"],["little caesar","1931"]],
  ["The 39 Steps",1935,["thriller"],["the 39 steps","1935"]],
  ["The Lady Vanishes",1938,["mystery","thriller"],["the lady vanishes","1938"]],
  ["Rebecca",1940,["mystery","romance"],["rebecca","1940"]],
  ["The Most Dangerous Game",1932,["adventure","thriller"],["most dangerous game","1932"]]
];

export const catalog = movieSeeds.map(([title, year, genres, searchTerms]) =>
  createMovie({
    id: "seed-" + String(year) + "-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    contentType: "movie",
    title,
    year,
    genres,
    searchTerms,
    sources: []
  })
);
