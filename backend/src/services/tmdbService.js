require('dotenv').config();

const axios = require('axios');
const Genre = require('../models/Genre');
const Movie = require('../models/Movie');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchGenres() {
    try {
        const [movieGenresRes, tvGenresRes] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
                params: { api_key: TMDB_API_KEY, language: 'en-US' }
            }),
            axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
                params: { api_key: TMDB_API_KEY, language: 'en-US' }
            })
        ]);

        // movie ve tv genre'larını birleştir (isim aynıysa tek olsun)
        const allGenresMap = new Map();

        for (const genre of [...movieGenresRes.data.genres, ...tvGenresRes.data.genres]) {
            allGenresMap.set(genre.id, genre.name); // id unique olduğundan Map kullanımı ideal
        }

        // Map'i diziye çevir
        return Array.from(allGenresMap.entries()).map(([id, name]) => ({
            tmdbId: id,
            name
        }));

    } catch (error) {
        console.error('Error fetching genres:', error);
        throw error;
    }
}
async function syncGenres() {
    const genres = await fetchGenres();
    const genrePromises = genres.map(async (genre) => {
        return Genre.findOneAndUpdate(
            { tmdbId: genre.tmdbId },  // burası doğru olmalı
            { name: genre.name, tmdbId: genre.tmdbId },  // hem name hem tmdbId güncellenmeli
            { upsert: true, new: true }
        );
    });
    return Promise.all(genrePromises);
}

async function fetchMovies(page = 1) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US', page }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
}

async function saveMovie(movie) {
    try {
        const genreIds = await Promise.all(
            movie.genre_ids.map(async (tmdbGenreId) => {
                let genre = await Genre.findOne({ tmdbId: tmdbGenreId });
                if (!genre) {
                    genre = await Genre.create({ tmdbId: tmdbGenreId, name: "Unknown" });
                }
                return genre._id;
            })
        );

        await Movie.updateOne(
            { tmdbId: movie.id },
            {
                $set: {
                    title: movie.title,
                    overview: movie.overview,
                    releaseDate: movie.release_date,
                    genres: genreIds,
                    popularity: movie.popularity,
                    voteAverage: movie.vote_average,
                    voteCount: movie.vote_count,
                    posterPath: movie.poster_path,
                    backdropPath: movie.backdrop_path,
                    originalLanguage: movie.original_language,
                    originalTitle: movie.original_title,
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error saving movie:', error);
        throw error;
    }
}

async function fetchSeries(page = 1) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
            params: { api_key: TMDB_API_KEY, language: 'en-US', page }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching series:', error);
        throw error;
    }
}

async function saveSeries(series) {
    try {
        const genreIds = await Promise.all(
            series.genre_ids.map(async (tmdbGenreId) => {
                let genre = await Genre.findOne({ tmdbId: tmdbGenreId });
                if (!genre) {
                    // Önce "Unknown" ismine sahip genre varsa onu kullan
                    genre = await Genre.findOne({ name: "Unknown" });
                }
                return genre._id;
            })
        );

        await Series.updateOne(
            { tmdbId: series.id },
            {
                $set: {
                    tmdbId: series.id,
                    title: series.name,
                    overview: series.overview,
                    firstAirDate: series.first_air_date,
                    genres: genreIds,
                    popularity: series.popularity,
                    voteAverage: series.vote_average,
                    voteCount: series.vote_count,
                    posterPath: series.poster_path,
                    backdropPath: series.backdrop_path,
                    originalLanguage: series.original_language,
                    originalName: series.original_name,
                    originCountry: series.origin_country || []
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error saving series:', error);
        throw error;
    }
}

async function fetchSeriesDetails(seriesId) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${seriesId}`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching series details:', error);
    throw error;
  }
}

// Sezon detay getir
async function fetchSeasonDetails(seriesId, seasonNumber) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}`, {
      params: { api_key: TMDB_API_KEY, language: 'en-US' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching season details:', error);
    throw error;
  }
}

// Episode kaydet
async function saveEpisode(episodeData, seasonId) {
  try {
    await Episode.updateOne(
      { tmdbId: episodeData.id },
      {
        $set: {
          tmdbId: episodeData.id,
          season: seasonId,
          episodeNumber: episodeData.episode_number,
          name: episodeData.name,
          overview: episodeData.overview,
          airDate: episodeData.air_date,
          stillPath: episodeData.still_path,
          voteAverage: episodeData.vote_average,
          voteCount: episodeData.vote_count,
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving episode:', error);
    throw error;
  }
}

// Season kaydet + içindeki bölümleri kaydet
async function saveSeason(seasonData, tvShowId) {
  try {
    const seasonDoc = await Season.findOneAndUpdate(
      { tvShow: tvShowId, seasonNumber: seasonData.season_number },
      {
        $set: {
          name: seasonData.name,
          overview: seasonData.overview,
          airDate: seasonData.air_date,
          posterPath: seasonData.poster_path,
          episodeCount: seasonData.episodes.length,
          tvShow: tvShowId,
        }
      },
      { upsert: true, new: true }
    );

    // Bölümleri kaydet
    for (const episode of seasonData.episodes) {
      await saveEpisode(episode, seasonDoc._id);
    }

    return seasonDoc;
  } catch (error) {
    console.error('Error saving season:', error);
    throw error;
  }
}

// Series kaydet (ve detaylarını çek, sezonları da kaydet)
async function saveSeriesWithDetails(seriesSummary) {
  try {
    // Series detayları çek
    const seriesDetails = await fetchSeriesDetails(seriesSummary.id);

    // Genre Id'lerini al (kendi Genre koleksiyonundaki ObjectId'ler)
    const genreIds = await Promise.all(
      (seriesDetails.genres || []).map(async (genre) => {
        let g = await Genre.findOne({ tmdbId: genre.id });
        if (!g) {
          g = await Genre.create({ tmdbId: genre.id, name: genre.name });
        }
        return g._id;
      })
    );

    // Series dokümanını update et veya yarat
    const seriesDoc = await Series.findOneAndUpdate(
      { tmdbId: seriesDetails.id },
      {
        $set: {
          tmdbId: seriesDetails.id,
          title: seriesDetails.name,
          overview: seriesDetails.overview,
          firstAirDate: seriesDetails.first_air_date,
          genres: genreIds,
          popularity: seriesDetails.popularity,
          voteAverage: seriesDetails.vote_average,
          voteCount: seriesDetails.vote_count,
          posterPath: seriesDetails.poster_path,
          backdropPath: seriesDetails.backdrop_path,
          originalLanguage: seriesDetails.original_language,
          originalName: seriesDetails.original_name,
          originCountry: seriesDetails.origin_country || []
        }
      },
      { upsert: true, new: true }
    );

    // Sezonları kaydet
    for (const seasonSummary of seriesDetails.seasons) {
      // Sezon detaylarını al ve kaydet
      const seasonDetails = await fetchSeasonDetails(seriesDetails.id, seasonSummary.season_number);
      await saveSeason(seasonDetails, seriesDoc._id);
    }

    return seriesDoc;
  } catch (error) {
    console.error('Error saving series with details:', error);
    throw error;
  }
}

module.exports = {
fetchGenres,
syncGenres,
fetchMovies,
saveMovie,
fetchSeries,
saveSeries,
  fetchSeriesDetails,
  fetchSeasonDetails,
  saveEpisode,
  saveSeason,
  saveSeriesWithDetails,
};