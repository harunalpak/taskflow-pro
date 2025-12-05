import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorMiddleware } from './common/error-middleware';
import { globalRateLimiter } from './common/middleware/rate-limiter';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { ProjectModule } from './modules/projects/project.module';
import { TaskModule } from './modules/tasks/task.module';
import { ReportModule } from './modules/reports/report.module';
import logger from './common/logger';
import { asyncHandler } from './common/async-handler';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.frontend.url,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global rate limiting
  app.use(globalRateLimiter);

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Debug endpoint for Event Loop demonstration
  app.get(
    '/debug/event-loop',
    asyncHandler(async (req: Request, res: Response) => {
      const logs: string[] = [];

      const log = (message: string) => {
        const timestamp = new Date().toISOString();
        logs.push(`[${timestamp}] ${message}`);
        console.log(`[Event Loop Demo] ${message}`);
      };

      log('=== Event Loop Demonstration ===');

      // Synchronous code
      log('1. Synchronous code starts');

      // setTimeout (Timer phase)
      setTimeout(() => {
        log('3. setTimeout callback (Timer phase)');
      }, 0);

      // setImmediate (Check phase)
      setImmediate(() => {
        log('4. setImmediate callback (Check phase)');
      });

      // process.nextTick (nextTick queue - highest priority)
      process.nextTick(() => {
        log('2. process.nextTick callback (nextTick queue - highest priority)');
      });

      // Promise (Microtask queue)
      Promise.resolve().then(() => {
        log('2.5. Promise.then callback (Microtask queue)');
      });

      // CPU-intensive synchronous operation
      log('Starting CPU-intensive operation...');
      const start = Date.now();
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      const duration = Date.now() - start;
      log(`CPU-intensive operation completed in ${duration}ms (sum: ${sum})`);

      // Another setTimeout
      setTimeout(() => {
        log('5. Another setTimeout callback');
      }, 10);

      // Another setImmediate
      setImmediate(() => {
        log('6. Another setImmediate callback');
      });

      log('Synchronous code ends');

      // Wait a bit to capture all callbacks
      await new Promise((resolve) => setTimeout(resolve, 100));

      res.json({
        success: true,
        message: 'Event Loop demonstration completed',
        explanation: {
          order: [
            '1. Synchronous code executes first',
            '2. process.nextTick callbacks (highest priority)',
            '2.5. Promise.then callbacks (microtask queue)',
            '3. setTimeout callbacks (Timer phase)',
            '4. setImmediate callbacks (Check phase)',
          ],
          notes: [
            'process.nextTick has the highest priority and runs before any other async callbacks',
            'Promise.then callbacks run in the microtask queue, after nextTick but before timers',
            'setTimeout(0) and setImmediate may execute in different orders depending on the context',
            'CPU-intensive operations block the event loop, delaying all callbacks',
          ],
        },
        logs,
      });
    })
  );

  // API routes
  const apiRouter = express.Router();

  // Initialize modules
  const authModule = new AuthModule();
  const userModule = new UserModule();
  const projectModule = new ProjectModule();
  const taskModule = new TaskModule();
  const reportModule = new ReportModule();

  // Register routes
  apiRouter.use('/auth', authModule.getRouter());
  apiRouter.use('/users', userModule.getRouter());
  apiRouter.use('/projects', projectModule.getRouter());
  apiRouter.use('/tasks', taskModule.getRouter());
  apiRouter.use('/reports', reportModule.getRouter());

  app.use(config.apiPrefix, apiRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        statusCode: 404,
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
}

