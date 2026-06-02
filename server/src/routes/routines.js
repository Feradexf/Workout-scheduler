const express = require('express');

module.exports = function makeRoutinesRouter({ dataStore }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ routines: dataStore.routines.list() });
  });

  router.post('/', (req, res) => {
    const { name, exercises } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const routine = {
      id: Date.now(),
      name: name.trim(),
      exercises: Array.isArray(exercises)
        ? exercises.map((ex) => ({
            name: String(ex?.name || '').trim(),
            workSec: Number(ex?.workSec || 0),
            restSec: Number(ex?.restSec || 0)
          }))
        : []
    };

    dataStore.routines.upsert(routine);
    res.status(201).json({ routine });
  });

  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, exercises } = req.body || {};

    const existing = dataStore.routines.list().find((r) => String(r.id) === String(id));
    if (!existing) return res.status(404).json({ error: 'Routine not found' });

    const updated = {
      ...existing,
      name: typeof name === 'string' && name.trim() ? name.trim() : existing.name,
      exercises: Array.isArray(exercises)
        ? exercises.map((ex) => ({
            name: String(ex?.name || '').trim(),
            workSec: Number(ex?.workSec || 0),
            restSec: Number(ex?.restSec || 0)
          }))
        : existing.exercises
    };

    dataStore.routines.upsert(updated);
    res.json({ routine: updated });
  });

  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const existing = dataStore.routines.list().find((r) => String(r.id) === String(id));
    if (!existing) return res.status(404).json({ error: 'Routine not found' });

    dataStore.routines.deleteById(id);
    res.json({ ok: true });
  });

  return router;
};

