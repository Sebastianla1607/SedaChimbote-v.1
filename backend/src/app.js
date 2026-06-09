const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");
const triageRoutes = require("./routes/triage.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require('./routes/admin.routes')
const techRoutes = require('./routes/tech.routes')
const notificationRoutes = require('./routes/notification.routes')

app.use('/api/notifications', notificationRoutes)
app.use('/api/tech', techRoutes)
app.use('/api/admin', adminRoutes)
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);8
app.use("/api/tickets", ticketRoutes);
app.use("/api/triage", triageRoutes);

app.get("/", (req, res) => {
  res.json({ mensaje: "TODO  FUNCIONANDO :) ATTE: LEAR" });
});

module.exports = app;
