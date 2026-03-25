import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Temporary completely isolated ping route!
app.get("/api/ping", (req, res) => res.json({ status: "isolated-pong" }));

// Now try to import the rest of the app dynamically or just use it as it's being developed
import mainApp from '../server/index.js';

// Route everything else to the main app if it didn't crash
app.use("/", mainApp);

export default app;
