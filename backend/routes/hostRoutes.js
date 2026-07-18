const express = require("express");
const router = express.Router();
const { getHosts } = require("../controllers/hostController");

router.get("/", getHosts);

module.exports = router;
