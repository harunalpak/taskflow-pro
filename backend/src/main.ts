import { createApp } from './app';
import { config } from './config/env';
import logger from './common/logger';

async function bootstrap() {
  const app = createApp();

  app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`API prefix: ${config.apiPrefix}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});

