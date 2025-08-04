const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");

router.get('/sync-genres', async (req, res) => {
  try {
    const result = await tmdbService.syncGenres();
    res.json({ message: 'Genres synced successfully', count: result.length });
  } catch (error) {
    console.error("Error in /sync-genres route:", error);
    res.status(500).json({ error: 'Failed to sync genres', details: error.message });
  }
});


router.get("/sync-movies", async (req, res) => {
  const targetCount = parseInt(req.query.count) || 500;
  const itemsPerPage = 20;
  const totalPages = Math.ceil(targetCount / itemsPerPage);

  try {
    let totalSynced = 0;

    for (let page = 1; page <= totalPages; page++) {
      const movies = await tmdbService.fetchMovies(page);
      for (const movie of movies) {
        await tmdbService.saveMovie(movie);
        totalSynced++;
        if (totalSynced >= targetCount) break;
      }
    }

    res.json({ message: `Movies synced successfully`, count: totalSynced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/sync-series", async (req, res) => {
  const targetCount = parseInt(req.query.count) || 500;
  const itemsPerPage = 20;
  const totalPages = Math.ceil(targetCount / itemsPerPage);

  try {
    let totalSynced = 0;

    for (let page = 1; page <= totalPages; page++) {
      const seriesList = await tmdbService.fetchSeries(page);
      
      for (const seriesSummary of seriesList) {
        await tmdbService.saveSeriesWithDetails(seriesSummary);
        totalSynced++;
        if (totalSynced >= targetCount) break;
      }
      if (totalSynced >= targetCount) break;
    }

    res.json({ message: 'Series synced with seasons and episodes successfully', count: totalSynced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;