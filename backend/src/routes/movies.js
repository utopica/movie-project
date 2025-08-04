const express = require('express');
const router = express.Router();

const Genre = require('../models/Genre');
const Movie = require('../models/Movie');
const Series = require('../models/Series');
const Response = require('../lib/Response');

router.get('/top-movies', async (req, res) => {
  
  try {
    const topMovies = await Movie.find({})
      .populate('genres')
      .sort({ voteCount: -1 })
      .limit(10)
      .select('tmdbId title originalTitle overview releaseDate genres posterPath backdropPath voteAverage voteCount');
          
   
    res.json({
      success: true,
      data: topMovies
    });
  } catch (error) {
  
    res.status(500).json({
      success: false,
      message: 'Filmler yüklenirken bir hata oluştu',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'popular';
    const category = req.query.category || 'all';
    const sort = req.query.sort || 'latest';

    let query = { voteCount: { $gt: 500 } };

    if (category !== 'all') {
      const genreDoc = await Genre.findOne({ name: new RegExp(category, 'i') });
      if (genreDoc) {
        query.genres = genreDoc._id;
      } else {
        return res.json({
          movies: [],
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: page > 1
        });
      }
    }

    let sortOptions = {};
    switch (sort) {
      case 'latest':
        sortOptions = { createdAt: -1 };
        break;
      case 'year':
        sortOptions = { releaseDate: -1 };
        break;
      case 'title':
        sortOptions = { title: 1 };
        break;
      case 'rating':
        sortOptions = { voteAverage: -1 };
        break;
    }

    switch (filter) {
      case 'popular':
        sortOptions = { voteAverage: -1, popularity: -1 };
        break;
      case 'latest':
        sortOptions = { releaseDate: -1 };
        break;
      case 'added':
        sortOptions = { createdAt: -1 };
        break;
    }

    const [movies, totalCount] = await Promise.all([
      Movie.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOptions)
        .select('title posterPath releaseDate voteAverage genres createdAt')
        .populate('genres', 'name'),
      Movie.countDocuments(query)
    ]);

    const formattedMovies = movies.map(movie => ({
      _id: movie._id,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseDate: movie.releaseDate,
      rating: movie.voteAverage,
      genre: movie.genres.map(g => g.name).join(', ') || '',
      createdAt: movie.createdAt
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      movies: formattedMovies,
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});


router.get('/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    await Movie.findByIdAndUpdate(movieId, { $inc: { viewCount: 1 } });

    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});




router.get('/search', async (req, res) => {
  try {
    const { q, type, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(q.trim(), 'i');
    
    const searchQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { genre: searchRegex },
        { cast: searchRegex }
      ]
    };

    let results = [];
    let totalCount = 0;

    if (!type || type === 'all') {
      const [movies, series, movieCount, seriesCount] = await Promise.all([
        Movie.find(searchQuery)
          .skip(skip)
          .limit(parseInt(limit) / 2)
          .select('title posterPath releaseDate rating genre')
          .lean(),
        Series.find(searchQuery)
          .skip(skip)
          .limit(parseInt(limit) / 2)
          .select('title posterPath firstAirDate rating genre numberOfSeasons')
          .lean(),
        Movie.countDocuments(searchQuery),
        Series.countDocuments(searchQuery)
      ]);

      results = [
        ...movies.map(m => ({ ...m, type: 'movie' })),
        ...series.map(s => ({ ...s, type: 'series' }))
      ];
      totalCount = movieCount + seriesCount;
    } else if (type === 'movies') {
      const [movies, movieCount] = await Promise.all([
        Movie.find(searchQuery)
          .skip(skip)
          .limit(parseInt(limit))
          .select('title posterPath releaseDate rating genre'),
        Movie.countDocuments(searchQuery)
      ]);
      results = movies.map(m => ({ ...m.toObject(), type: 'movie' }));
      totalCount = movieCount;
    } else if (type === 'series') {
      const [series, seriesCount] = await Promise.all([
        Series.find(searchQuery)
          .skip(skip)
          .limit(parseInt(limit))
          .select('title posterPath firstAirDate rating genre numberOfSeasons'),
        Series.countDocuments(searchQuery)
      ]);
      results = series.map(s => ({ ...s.toObject(), type: 'series' }));
      totalCount = seriesCount;
    }

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      results,
      query: q,
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;