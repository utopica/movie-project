const express = require("express");

const Series = require("../models/Series");
const Genre = require("../models/Genre");
const Season = require("../models/Season");
const Episode = require("../models/Episode");
const Response = require("../lib/Response");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || "popular";
    const category = req.query.category || "all";
    const sort = req.query.sort || "latest";

    let query = { voteCount: { $gt: 500 } };

    if (category !== "all") {
      const genreDoc = await Genre.findOne({ name: new RegExp(category, "i") });
      if (genreDoc) {
        query.genres = genreDoc._id;
      }
    }

    let sortOptions = {};
    switch (sort) {
      case "latest":
        sortOptions = { createdAt: -1 };
        break;
      case "year":
        sortOptions = { firstAirDate: -1 };
        break;
      case "title":
        sortOptions = { title: 1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    switch (filter) {
      case "popular":
        sortOptions = { rating: -1, viewCount: -1 };
        break;
      case "latest":
        sortOptions = { firstAirDate: -1 };
        break;
      case "added":
        sortOptions = { createdAt: -1 };
        break;
    }

    const [seriesList, totalCount] = await Promise.all([
      Series.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOptions)
        .select("title posterPath firstAirDate rating genre createdAt"),
      Series.countDocuments(query),
    ]);

    const seriesWithSeasons = await Promise.all(
      seriesList.map(async (series) => {
        const seasonCount = await Season.countDocuments({ tvShow: series._id });
        return {
          ...series.toObject(),
          numberOfSeasons: seasonCount,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      series: seriesWithSeasons,
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    res.status(500).json({ error: "Failed to fetch series" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const seriesId = req.params.id;

    const series = await Series.findById(seriesId).populate("genres");
    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }

    const seasons = await Season.find({ tvShow: seriesId }).sort({
      seasonNumber: 1,
    });

    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        const episodes = await Episode.find({ season: season._id }).sort({
          episodeNumber: 1,
        });
        return {
          ...season.toObject(),
          episodes,
        };
      })
    );

    res.json({
      series,
      seasons: seasonsWithEpisodes,
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
