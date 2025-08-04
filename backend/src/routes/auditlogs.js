const express = require("express");
const moment = require("moment");

const Response = require("../lib/Response");
const AuditLogs = require("../models/AuditLogs");

var router = express.Router();

const auth = require("../lib/auth")();

router.use(auth.authenticate());

router.get("/", auth.checkRoles("audit_log_view"), async (req, res) => {
  try {
    let body = req.body;
    let query = {};
    let skip = body.skip;
    let limit = body.limit;

    if (typeof body.skip === "number") {
      skip = 0;
    }

    if (typeof body.limit === "number" || body.limit > 500) {
      limit = 500;
    }

    if (body.begin_date && body.end_date) {
      query.created_at = {
        $gte: moment(body.begin_date),
        $lte: moment(body.end_date),
      };
    } else {
      query.created_at = {
        $gte: moment().subtract(1, "day").startOf("day"),
        $lte: moment(),
      };
    }
    let auditLogs = await AuditLogs.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json(Response.success(auditLogs));
  } catch (err) {
    let errorResponse = Response.error(res, req.user?.lang);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
