require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { createDataStore } = require('./storage/dataStore');
const makeRoutinesRouter = require('./routes/routines');
const makeLogsRouter = require('./routes/logs');

const app = express();

app.use(cors());
app.use(express.json());

const dataFile = process.env.DATA_FILE || './data.json';
const dataStore = createDataStore(dataFile);

// Routes
app.use('/api/routines', makeRoutinesRouter({ dataStore }));
app.use('/api/logs', makeLogsRouter({ dataStore }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Serve client in the future (optional). For now API only.

module.exports = app;

