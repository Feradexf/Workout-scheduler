const express = require('express');

function oneWeekCount(logs) {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return logs.filter((l) => new Date(l.dateISO) >= oneWeekAgo).length;
}

module.exports = function makeLogsRouter({ dataStore }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const logs = dataStore.logs.list();
    res.json({
      logs,
      weeklySummary: {
        workoutsThisWeek: oneWeekCount(logs)
      }
    });
  });

  router.post('/', (req, res) => {
    const { routineId, routineName, exercisesDone } = req.body || {};
    if (!routineId) return res.status(400).json({ error: 'routineId is required' });
    if (!routineName || typeof routineName !== 'string') return res.status(400).json({ error: 'routineName is required' });
    if (typeof exercisesDone !== 'number') return res.status(400).json({ error: 'exercisesDone must be a number' });

    const log = {
      dateISO: new Date().toISOString(),
      routineId,
      routineName,
      exercisesDone
    };

    dataStore.logs.add(log);
    res.status(201).json({ log });
  });

  router.delete('/', (req, res) => {
    dataStore.logs.clear();
    res.json({ ok: true });
  });

  return router;
};

