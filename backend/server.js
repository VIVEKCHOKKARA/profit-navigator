require("dotenv").config();
const express = require("express");
const cors = require("cors");

const forecastRouter = require("./routes/forecast");
const chatRouter = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/forecast", forecastRouter);
app.use("/api/chat", chatRouter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
