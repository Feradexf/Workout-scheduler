const fs = require('fs');
const path = require('path');

function safeParseJSON(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function createDataStore(dataFile) {
  const resolved = path.resolve(dataFile);

  function ensureFile() {
    if (!fs.existsSync(resolved)) {
      const initial = { routines: [], logs: [] };
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(resolved, 'utf8');
    const parsed = safeParseJSON(raw, { routines: [], logs: [] });
    return parsed;
  }

  let cache = ensureFile();

  function persist() {
    fs.writeFileSync(resolved, JSON.stringify(cache, null, 2), 'utf8');
  }

  return {
    getSnapshot() {
      return cache;
    },

    routines: {
      list() {
        return cache.routines;
      },
      upsert(routine) {
        const idx = cache.routines.findIndex((r) => String(r.id) === String(routine.id));
        if (idx === -1) cache.routines.push(routine);
        else cache.routines[idx] = routine;
        persist();
        return routine;
      },
      deleteById(id) {
        cache.routines = cache.routines.filter((r) => String(r.id) !== String(id));
        persist();
      }
    },

    logs: {
      list() {
        return cache.logs;
      },
      add(log) {
        cache.logs.push(log);
        persist();
        return log;
      },
      clear() {
        cache.logs = [];
        persist();
      }
    }
  };
}

module.exports = { createDataStore };

