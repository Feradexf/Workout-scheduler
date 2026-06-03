const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Simple file-based storage
const DATA_FILE = path.join(__dirname, 'data.json');

// Ensure data.json exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ routines: [], logs: [] }));
}

function readData() {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Get all routines
app.get('/api/routines', (req, res) => {
  const data = readData();
  res.json({ routines: data.routines || [] });
});

// Create routine
app.post('/api/routines', (req, res) => {
  const data = readData();
  const newRoutine = {
    id: Date.now(),
    name: req.body.name,
    exercises: req.body.exercises || [],
    createdAt: new Date().toISOString()
  };
  data.routines.push(newRoutine);
  writeData(data);
  res.status(201).json({ routine: newRoutine });
});

// Update routine
app.put('/api/routines/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const index = data.routines.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  data.routines[index] = { ...data.routines[index], ...req.body };
  writeData(data);
  res.json({ routine: data.routines[index] });
});

// Delete routine
app.delete('/api/routines/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  data.routines = data.routines.filter(r => r.id !== id);
  writeData(data);
  res.status(204).send();
});

// Get logs
app.get('/api/logs', (req, res) => {
  const data = readData();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyCount = (data.logs || []).filter(l => new Date(l.dateISO) >= weekAgo).length;
  res.json({ 
    logs: data.logs || [], 
    weeklySummary: { workoutsThisWeek: weeklyCount }
  });
});

// Create log
app.post('/api/logs', (req, res) => {
  const data = readData();
  const newLog = {
    id: Date.now(),
    dateISO: new Date().toISOString(),
    routineId: req.body.routineId,
    routineName: req.body.routineName,
    exercisesDone: req.body.exercisesDone
  };
  data.logs.push(newLog);
  writeData(data);
  res.status(201).json({ log: newLog });
});

// Clear logs
app.delete('/api/logs', (req, res) => {
  const data = readData();
  data.logs = [];
  writeData(data);
  res.status(204).send();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});