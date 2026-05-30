import { env } from './config';
import { buildApp } from './app';

// Entry point: build the app, then bind it to a real TCP port.
const app = buildApp();

app
  .listen({ port: env.port, host: env.host })
  .then((address) => {
    app.log.info(`Knaq API listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
