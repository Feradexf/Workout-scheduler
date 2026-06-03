const app = require('./app');

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Workout API listening on http://localhost:${port}`);
});

