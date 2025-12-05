import redis from '../redis/redis-client';
import logger from '../../common/logger';
import { createReportWorker } from './report-worker';

interface ReportJob {
  reportId: string;
  projectId: string;
  reportType: string;
  requestedAt: string;
}

async function processQueue() {
  logger.info('Worker process started, listening for jobs...');

  while (true) {
    try {
      // Blocking pop from Redis queue (wait up to 5 seconds)
      const result = await redis.brpop('report:queue', 5);

      if (result) {
        const [, jobData] = result;
        const job: ReportJob = JSON.parse(jobData);

        logger.info({ job }, 'Job received from queue');

        try {
          // Process in worker thread
          await createReportWorker(job);
          logger.info({ reportId: job.reportId }, 'Job completed successfully');
        } catch (error) {
          logger.error({ error, job }, 'Error processing job');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error in queue processing loop');
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Worker shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Worker shutting down gracefully...');
  process.exit(0);
});

// Start processing
processQueue().catch((error) => {
  logger.error({ error }, 'Fatal error in worker');
  process.exit(1);
});

