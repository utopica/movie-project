const express = require("express");

const Genre = require("../models/Genre");
const Movie = require("../models/Movie");
const Series = require("../models/Series");

const router = express.Router();

const auth = require("../lib/auth")();

router.get("/", async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json(genres);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch genres",
      details: error.message,
    });
  }
});

router.get("/items", async (req, res) => {
  try {
    const genres = await Genre.aggregate([
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "genres",
          as: "sampleMovies",
          pipeline: [
            { $match: { voteCount: { $gt: 100 } } },
            { $project: { title: 1, posterPath: 1 } },
          ],
        },
      },
      {
        $addFields: {
          movieCount: { $size: "$sampleMovies" },
        },
      },
      {
        $match: {
          name: { $in: ["Action", "Drama", "Crime", "Comedy", "Horror"] },
        },
      },
      {
        $sort: { movieCount: -1 },
      },
      {
        $project: {
          name: 1,
          description: 1,
          sampleMovies: { $slice: ["$sampleMovies", 4] },
          movieCount: 1,
        },
      },
    ]);

    res.json(genres);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch genres", details: error.message });
  }
});

router.get("/:genreId", async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const genre = await Genre.findById(genreId);
    if (!genre) {
      return res.status(404).json({ error: "Genre not found" });
    }

    const [movies, series, totalMovies, totalSeries] = await Promise.all([
      Movie.find({ genres: genreId, voteCount: { $gt: 100 } }).sort({
        createdAt: -1,
      }),
      Series.find({ genres: genreId, voteCount: { $gt: 100 } }).sort({
        createdAt: -1,
      }),
      Movie.countDocuments({ genres: genreId, voteCount: { $gt: 100 } }),
      Series.countDocuments({ genres: genreId, voteCount: { $gt: 100 } }),
    ]);

    res.json({
      genre,
      movies,
      series,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((totalMovies + totalSeries) / limit),
        totalMovies,
        totalSeries,
      },
    });
  } catch (error) {
    console.error("Error fetching genre details:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch genre details", details: error.message });
  }
});

router.get("/:genreId/items", async (req, res) => {
  try {
    const { genreId } = req.params;
    const { type = "movie", page = 1, limit = 12 } = req.query;

    const skip = (page - 1) * limit;
    const Model = type === "movie" ? Movie : Series;

    const genre = await Genre.findById(genreId);
    if (!genre) return res.status(404).json({ message: "Genre not found" });

    const query = { genres: genre._id };
    const totalItems = await Model.countDocuments(query);
    const items = await Model.find(query)
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("title name posterPath backdropPath");

    res.json({
      genre: { id: genre._id, name: genre.name, voteCount: { $gt: 100 } },
      totalItems,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalItems / limit),
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
