require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const connectDB = require("./config/db");
const { generalLimiter } = require("./middleware/rateLimiter");

// Load Passport strategy configuration
require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const profileRoutes = require("./routes/profileRoutes");
const stayRequestRoutes = require("./routes/stayRequestRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // required so the browser sends/receives the refresh-token cookie
  })
);

// Initialize passport for OAuth logins
app.use(passport.initialize());

// Global rate limiter — protects all /api routes (200 req / 15 min per IP)
app.use("/api", generalLimiter);

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", profileRoutes);
app.use("/api/stay-requests", stayRequestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/hosts", require("./routes/hostRoutes"));
app.use("/api/history", require("./routes/history"));

// --- BullMQ Dashboard ---
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { qdrantQueue } = require('./workers/qdrantQueue');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(qdrantQueue)],
  serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// Simple health check — useful for confirming deployment worked
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Error handling for unmatched routes ---
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler Caught:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    stack: err.stack,
  });
});

// --- Wrap express app in http server for Socket.IO ---
const http = require("http");
const { Server } = require("socket.io");
const { initializeChatSocket } = require("./sockets/chatSocket");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Initialize Socket event listeners
initializeChatSocket(io);

// --- Start server after DB connects & Init Qdrant ---
const PORT = process.env.PORT || 5000;
const { initQdrant } = require("./services/qdrantService");
const { startCronJobs } = require("./jobs/expireRequests");

// Initialize workers
require("./workers/qdrantWorker");

connectDB().then(async () => {
  await initQdrant();
  startCronJobs(); // Initialize scheduled tasks
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`BullMQ Dashboard running at http://localhost:${PORT}/admin/queues`);
  });
});
