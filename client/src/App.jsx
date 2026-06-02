import { useEffect, useMemo, useState } from 'react';
import LandingPage from './Landingpage';

const API_BASE = 'https://workout-scheduler-backend.onrender.com';
const DEFAULT_EXERCISE = { name: '', workSec: 45, restSec: 15 };
const EMPTY_TIMER = { status: 'idle', phase: 'idle', index: 0, secondsLeft: 0 };
const WEEKLY_GOAL = 4;

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!res.ok) {
    throw new Error(payload?.error || res.statusText || 'Request failed');
  }

  return payload || {};
}

function apiGet(path) {
  return apiRequest(path);
}

function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function apiPut(path, body) {
  return apiRequest(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function apiDelete(path) {
  return apiRequest(path, { method: 'DELETE' });
}

function getValidId(items, preferredId) {
  if (preferredId && items.some((item) => String(item.id) === String(preferredId))) {
    return String(preferredId);
  }

  return items[0] ? String(items[0].id) : '';
}

function normalizeSeconds(value, fallback = 0) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return fallback;
  return Math.max(0, Math.round(seconds));
}

function formatTime(totalSeconds) {
  const safeSeconds = normalizeSeconds(totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(totalSeconds) {
  const safeSeconds = normalizeSeconds(totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function getRoutineSeconds(routine) {
  return (routine?.exercises || []).reduce((total, exercise) => {
    return total + normalizeSeconds(exercise.workSec) + normalizeSeconds(exercise.restSec);
  }, 0);
}

function getTimerProgress(timer, routine) {
  const exercises = routine?.exercises || [];
  const total = getRoutineSeconds(routine);
  if (!total || timer.status === 'idle') return 0;

  let elapsed = 0;
  exercises.slice(0, timer.index).forEach((exercise) => {
    elapsed += normalizeSeconds(exercise.workSec) + normalizeSeconds(exercise.restSec);
  });

  const current = exercises[timer.index];
  if (current) {
    if (timer.phase === 'work') {
      elapsed += normalizeSeconds(current.workSec) - normalizeSeconds(timer.secondsLeft);
    }

    if (timer.phase === 'rest') {
      elapsed += normalizeSeconds(current.workSec);
      elapsed += normalizeSeconds(current.restSec) - normalizeSeconds(timer.secondsLeft);
    }
  }

  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function getLastLog(logs) {
  return [...logs].sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO))[0];
}

export default function App() {
  // 🔴 NEW: State to control landing page visibility
  const [showLanding, setShowLanding] = useState(true);
  
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [timerRoutineId, setTimerRoutineId] = useState('');
  const [logs, setLogs] = useState([]);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newExercise, setNewExercise] = useState(DEFAULT_EXERCISE);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(EMPTY_TIMER);

  const selectedRoutine = useMemo(
    () => routines.find((routine) => String(routine.id) === String(selectedRoutineId)),
    [routines, selectedRoutineId]
  );

  const timerRoutine = useMemo(
    () => routines.find((routine) => String(routine.id) === String(timerRoutineId)),
    [routines, timerRoutineId]
  );

  const routineExercises = selectedRoutine?.exercises || [];
  const timerExercises = timerRoutine?.exercises || [];
  const routineSeconds = getRoutineSeconds(timerRoutine);
  const timerProgress = getTimerProgress(timer, timerRoutine);
  const lastLog = getLastLog(logs);
  const totalExercises = routines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0);
  const weeklyProgress = Math.min(100, Math.round((workoutsThisWeek / WEEKLY_GOAL) * 100));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (timer.status !== 'running') return undefined;

    if (timer.secondsLeft <= 0) {
      const timeoutId = window.setTimeout(() => advanceTimer(), 200);
      return () => window.clearTimeout(timeoutId);
    }

    const intervalId = window.setInterval(() => {
      setTimer((current) => {
        if (current.status !== 'running') return current;
        return { ...current, secondsLeft: Math.max(current.secondsLeft - 1, 0) };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timer.status, timer.secondsLeft]);

  async function loadAllData(options = {}) {
    setLoading(true);
    try {
      const routinesData = await apiGet('/api/routines');
      const routinesList = routinesData.routines || [];
      setRoutines(routinesList);
      setSelectedRoutineId((current) => getValidId(routinesList, options.selectedRoutineId || current));
      setTimerRoutineId((current) => getValidId(routinesList, options.timerRoutineId || current));

      const logsData = await apiGet('/api/logs');
      setLogs(logsData.logs || []);
      setWorkoutsThisWeek(logsData.weeklySummary?.workoutsThisWeek || 0);
      setMessage(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Could not reach the backend at ${API_BASE}. Start the server, then refresh.`
      });
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
  }

  async function addRoutine(event) {
    event.preventDefault();
    const name = newRoutineName.trim();
    if (!name) {
      showMessage('error', 'Enter a routine name first.');
      return;
    }

    try {
      const data = await apiPost('/api/routines', { name, exercises: [] });
      setNewRoutineName('');
      await loadAllData({
        selectedRoutineId: String(data.routine.id),
        timerRoutineId: String(data.routine.id)
      });
      showMessage('success', `${data.routine.name} was added.`);
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  async function deleteRoutine() {
    if (!selectedRoutine) {
      showMessage('error', 'Choose a routine to delete.');
      return;
    }

    if (!window.confirm(`Delete ${selectedRoutine.name}?`)) return;

    try {
      await apiDelete(`/api/routines/${selectedRoutine.id}`);
      resetTimer();
      await loadAllData();
      showMessage('success', `${selectedRoutine.name} was deleted.`);
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  async function addExercise(event) {
    event.preventDefault();
    if (!selectedRoutine) {
      showMessage('error', 'Choose a routine before adding exercises.');
      return;
    }

    const name = newExercise.name.trim();
    const workSec = normalizeSeconds(newExercise.workSec);
    const restSec = normalizeSeconds(newExercise.restSec);

    if (!name) {
      showMessage('error', 'Enter an exercise name.');
      return;
    }

    if (workSec <= 0) {
      showMessage('error', 'Work time must be at least 1 second.');
      return;
    }

    const exercises = [...routineExercises, { name, workSec, restSec }];

    try {
      await apiPut(`/api/routines/${selectedRoutine.id}`, {
        name: selectedRoutine.name,
        exercises
      });
      setNewExercise(DEFAULT_EXERCISE);
      await loadAllData({ selectedRoutineId: String(selectedRoutine.id) });
      showMessage('success', `${name} was added to ${selectedRoutine.name}.`);
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  async function removeExercise(index) {
    if (!selectedRoutine) return;

    const exercise = routineExercises[index];
    const exercises = routineExercises.filter((_, exerciseIndex) => exerciseIndex !== index);

    try {
      await apiPut(`/api/routines/${selectedRoutine.id}`, {
        name: selectedRoutine.name,
        exercises
      });
      resetTimer();
      await loadAllData({ selectedRoutineId: String(selectedRoutine.id) });
      showMessage('success', `${exercise.name} was removed.`);
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  async function clearLogs() {
    if (!logs.length) return;
    if (!window.confirm('Delete all workout history?')) return;

    try {
      await apiDelete('/api/logs');
      await loadAllData();
      showMessage('success', 'Workout history was cleared.');
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  function startWorkout() {
    if (!timerRoutine) {
      showMessage('error', 'Choose a routine for the timer.');
      return;
    }

    if (timerExercises.length === 0) {
      showMessage('error', 'Add at least one exercise before starting.');
      return;
    }

    const invalidExercise = timerExercises.find((exercise) => normalizeSeconds(exercise.workSec) <= 0);
    if (invalidExercise) {
      showMessage('error', `${invalidExercise.name || 'An exercise'} needs a valid work time.`);
      return;
    }

    setTimer({
      status: 'running',
      phase: 'work',
      index: 0,
      secondsLeft: normalizeSeconds(timerExercises[0].workSec)
    });
    showMessage(null, null);
  }

  function pauseWorkout() {
    setTimer((current) => ({ ...current, status: 'paused' }));
  }

  function resumeWorkout() {
    setTimer((current) => ({ ...current, status: 'running' }));
  }

  function resetTimer() {
    setTimer(EMPTY_TIMER);
  }

  async function completeWorkout(routine = timerRoutine) {
    if (!routine) {
      resetTimer();
      return;
    }

    setTimer((current) => ({ ...current, status: 'saving', secondsLeft: 0 }));

    try {
      await apiPost('/api/logs', {
        routineId: Number(routine.id),
        routineName: routine.name,
        exercisesDone: routine.exercises?.length || 0
      });
      await loadAllData({ timerRoutineId: String(routine.id) });
      showMessage('success', `${routine.name} was completed and logged.`);
    } catch (error) {
      showMessage('error', `Workout completed, but the log was not saved: ${error.message}`);
    } finally {
      resetTimer();
    }
  }

  function advanceTimer() {
    if (!timerRoutine || timerExercises.length === 0) {
      resetTimer();
      return;
    }

    const currentExercise = timerExercises[timer.index];
    if (!currentExercise) {
      completeWorkout(timerRoutine);
      return;
    }

    if (timer.phase === 'work') {
      const restSec = normalizeSeconds(currentExercise.restSec);
      if (restSec > 0) {
        setTimer((current) => ({ ...current, phase: 'rest', secondsLeft: restSec }));
        return;
      }
    }

    const nextIndex = timer.index + 1;
    if (nextIndex < timerExercises.length) {
      setTimer({
        status: 'running',
        phase: 'work',
        index: nextIndex,
        secondsLeft: normalizeSeconds(timerExercises[nextIndex].workSec)
      });
      return;
    }

    completeWorkout(timerRoutine);
  }

  const timerTitle = timer.status === 'idle'
    ? 'Ready'
    : timer.phase === 'rest'
      ? 'Rest'
      : timerExercises[timer.index]?.name || 'Workout';

  const timerSubtitle = timerRoutine
    ? `${timerRoutine.name} - ${timerExercises.length} exercises - ${formatDuration(routineSeconds)}`
    : 'Select a routine to begin';

  // 🔴 NEW: Conditional rendering - Show Landing Page or Dashboard
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Workout schedule system</p>
          <h1>Training Dashboard</h1>
          <p className="topbar-copy">Build routines, run focused timers, and track completed sessions.</p>
        </div>

        <div className="topbar-actions">
          {/* 🔴 NEW: Home button to return to Landing Page */}
          <button className="ghost-button" type="button" onClick={() => setShowLanding(true)}>
            🏠 Home
          </button>
          <button className="ghost-button" type="button" onClick={() => loadAllData()} disabled={loading}>
            Refresh
          </button>
          <button className="ghost-button" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      {message?.text && (
        <div className={`notice notice-${message.type}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message">
            x
          </button>
        </div>
      )}

      <section className="metric-grid" aria-label="Workout summary">
        <div className="metric-card">
          <span className="metric-label">Routines</span>
          <strong>{routines.length}</strong>
          <span className="metric-note">{totalExercises} planned exercises</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">This week</span>
          <strong>{workoutsThisWeek}</strong>
          <span className="metric-note">{weeklyProgress}% of weekly goal</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Active plan</span>
          <strong>{timerRoutine ? formatDuration(routineSeconds) : '--'}</strong>
          <span className="metric-note">{timerRoutine?.name || 'No timer routine selected'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Last workout</span>
          <strong>{lastLog ? lastLog.routineName : '--'}</strong>
          <span className="metric-note">
            {lastLog ? new Date(lastLog.dateISO).toLocaleDateString() : 'No sessions logged yet'}
          </span>
        </div>
      </section>

      <section className="workspace-grid">
        <section className="panel routine-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Planner</p>
              <h2>Routines</h2>
            </div>
            <span className="count-pill">{routines.length}</span>
          </div>

          <form className="create-routine" onSubmit={addRoutine}>
            <input
              type="text"
              placeholder="New routine name"
              value={newRoutineName}
              onChange={(event) => setNewRoutineName(event.target.value)}
            />
            <button className="primary-button" type="submit">
              <span aria-hidden="true">+</span>
              Add
            </button>
          </form>

          <div className="routine-list" role="listbox" aria-label="Available routines">
            {routines.length === 0 ? (
              <div className="empty-state">Create your first routine to start scheduling workouts.</div>
            ) : (
              routines.map((routine) => {
                const isSelected = String(routine.id) === String(selectedRoutineId);
                const exerciseCount = routine.exercises?.length || 0;

                return (
                  <button
                    className={`routine-row ${isSelected ? 'is-selected' : ''}`}
                    key={routine.id}
                    type="button"
                    onClick={() => setSelectedRoutineId(String(routine.id))}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>
                      <strong>{routine.name}</strong>
                      <small>{exerciseCount} exercises - {formatDuration(getRoutineSeconds(routine))}</small>
                    </span>
                    <span className="row-arrow">&gt;</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="panel builder-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Routine builder</p>
              <h2>{selectedRoutine?.name || 'Select a routine'}</h2>
            </div>
            {selectedRoutine && (
              <button className="danger-button compact" type="button" onClick={deleteRoutine}>
                Delete
              </button>
            )}
          </div>

          {selectedRoutine ? (
            <>
              <div className="exercise-table">
                {routineExercises.length === 0 ? (
                  <div className="empty-state">No exercises yet. Add timed work and rest blocks below.</div>
                ) : (
                  routineExercises.map((exercise, index) => (
                    <div className="exercise-row" key={`${exercise.name}-${index}`}>
                      <span className="exercise-index">{index + 1}</span>
                      <span className="exercise-name">{exercise.name}</span>
                      <span className="time-chip">Work {formatDuration(exercise.workSec)}</span>
                      <span className="time-chip rest-chip">Rest {formatDuration(exercise.restSec)}</span>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => removeExercise(index)}
                        aria-label={`Remove ${exercise.name}`}
                      >
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form className="exercise-form" onSubmit={addExercise}>
                <label>
                  <span>Exercise</span>
                  <input
                    type="text"
                    placeholder="Push-ups"
                    value={newExercise.name}
                    onChange={(event) => setNewExercise({ ...newExercise, name: event.target.value })}
                  />
                </label>
                <label>
                  <span>Work sec</span>
                  <input
                    type="number"
                    min="1"
                    value={newExercise.workSec}
                    onChange={(event) => setNewExercise({ ...newExercise, workSec: event.target.value })}
                  />
                </label>
                <label>
                  <span>Rest sec</span>
                  <input
                    type="number"
                    min="0"
                    value={newExercise.restSec}
                    onChange={(event) => setNewExercise({ ...newExercise, restSec: event.target.value })}
                  />
                </label>
                <button className="primary-button" type="submit">
                  <span aria-hidden="true">+</span>
                  Exercise
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state">Select or create a routine to edit its exercises.</div>
          )}
        </section>

        <section className="panel timer-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Live timer</p>
              <h2>{timerTitle}</h2>
            </div>
            <span className={`status-pill status-${timer.status}`}>{timer.status}</span>
          </div>

          <label className="select-label">
            <span>Timer routine</span>
            <select
              value={timerRoutineId}
              onChange={(event) => {
                setTimerRoutineId(event.target.value);
                resetTimer();
              }}
            >
              <option value="">Choose routine</option>
              {routines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))}
            </select>
          </label>

          <div className="timer-core">
            <p>{timerSubtitle}</p>
            <div className="timer-face" aria-live="polite">
              {formatTime(timer.secondsLeft)}
            </div>
            <div className="timer-progress" aria-label={`${timerProgress}% complete`}>
              <span style={{ width: `${timerProgress}%` }} />
            </div>
            <p className="phase-copy">
              {timer.status === 'idle'
                ? 'Pick a routine and start when ready.'
                : timer.phase === 'rest'
                  ? 'Recover, breathe, and prepare for the next set.'
                  : `Exercise ${timer.index + 1} of ${timerExercises.length}`}
            </p>
          </div>

          <div className="timer-controls">
            {timer.status === 'idle' && (
              <button className="start-button" type="button" onClick={startWorkout}>
                <span aria-hidden="true">&gt;</span>
                Start
              </button>
            )}
            {timer.status === 'running' && (
              <button className="secondary-button" type="button" onClick={pauseWorkout}>
                <span aria-hidden="true">||</span>
                Pause
              </button>
            )}
            {timer.status === 'paused' && (
              <button className="start-button" type="button" onClick={resumeWorkout}>
                <span aria-hidden="true">&gt;</span>
                Resume
              </button>
            )}
            {timer.status !== 'idle' && timer.status !== 'saving' && (
              <button className="danger-button" type="button" onClick={resetTimer}>
                Cancel
              </button>
            )}
          </div>

          <div className="queue-list">
            {timerExercises.length === 0 ? (
              <div className="empty-state">The selected routine has no exercises.</div>
            ) : (
              timerExercises.map((exercise, index) => (
                <div
                  className={`queue-row ${timer.index === index && timer.status !== 'idle' ? 'is-current' : ''}`}
                  key={`${exercise.name}-${index}`}
                >
                  <span>{index + 1}</span>
                  <strong>{exercise.name}</strong>
                  <small>{formatDuration(exercise.workSec)} / {formatDuration(exercise.restSec)}</small>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Progress</p>
              <h2>Workout history</h2>
            </div>
            <button className="ghost-button compact" type="button" onClick={clearLogs} disabled={!logs.length}>
              Clear
            </button>
          </div>

          <div className="goal-block">
            <div>
              <span>Weekly goal</span>
              <strong>{workoutsThisWeek}/{WEEKLY_GOAL}</strong>
            </div>
            <div className="goal-bar" aria-label={`${weeklyProgress}% of weekly goal`}>
              <span style={{ width: `${weeklyProgress}%` }} />
            </div>
          </div>

          <div className="log-list">
            {logs.length === 0 ? (
              <div className="empty-state">Complete a timer session to create the first progress log.</div>
            ) : (
              [...logs].reverse().map((log,index) => (
                <div className="log-row" key={`${log.dateISO}-${index}`}>
                  <span className="log-date">
                    {new Date(log.dateISO).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span>
                    <strong>{log.routineName} </strong>
                    <small>{new Date(log.dateISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </span>
                  <span className="time-chip">{log.exercisesDone} exercises</span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}