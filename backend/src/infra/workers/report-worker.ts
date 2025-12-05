import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import prisma from '../db/prisma';
import logger from '../../common/logger';

interface ReportJob {
  reportId: string;
  projectId: string;
  reportType: string;
  requestedAt: string;
}

async function processReport(job: ReportJob) {
  logger.info({ reportId: job.reportId }, 'Processing report in worker thread');

  try {
    // Update status to PROCESSING
    await prisma.report.update({
      where: { id: job.reportId },
      data: { status: 'PROCESSING' },
    });

    // Simulate CPU-intensive work
    const tasks = await prisma.task.findMany({
      where: { projectId: job.projectId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: true,
      },
    });

    // Calculate summary
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'DONE').length,
      inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      todoTasks: tasks.filter((t) => t.status === 'TODO').length,
      overdueTasks: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      ).length,
      completedThisWeek: tasks.filter(
        (t) => t.status === 'DONE' && t.updatedAt >= weekAgo
      ).length,
      tasksByPriority: {
        high: tasks.filter((t) => t.priority === 'HIGH').length,
        medium: tasks.filter((t) => t.priority === 'MEDIUM').length,
        low: tasks.filter((t) => t.priority === 'LOW').length,
        none: tasks.filter((t) => !t.priority).length,
      },
      tasksByAssignee: tasks.reduce((acc, task) => {
        const assigneeName = task.assignee?.name || 'Unassigned';
        acc[assigneeName] = (acc[assigneeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      generatedAt: new Date().toISOString(),
    };

    // Update report with summary
    await prisma.report.update({
      where: { id: job.reportId },
      data: {
        status: 'COMPLETED',
        summary: summary as any,
        completedAt: new Date(),
      },
    });

    logger.info({ reportId: job.reportId }, 'Report processing completed');

    // Simulate email sending (console log)
    logger.info(
      {
        reportId: job.reportId,
        summary,
      },
      'Report generated successfully (would send email in production)'
    );

    return summary;
  } catch (error) {
    logger.error({ error, reportId: job.reportId }, 'Error processing report');

    await prisma.report.update({
      where: { id: job.reportId },
      data: { status: 'FAILED' },
    });

    throw error;
  }
}

if (!isMainThread) {
  // Worker thread
  const job = workerData as ReportJob;
  processReport(job)
    .then((result) => {
      parentPort?.postMessage({ success: true, result });
      process.exit(0);
    })
    .catch((error) => {
      parentPort?.postMessage({ success: false, error: error.message });
      process.exit(1);
    });
}

export function createReportWorker(job: ReportJob): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: job,
    });

    worker.on('message', (message) => {
      if (message.success) {
        resolve(message.result);
      } else {
        reject(new Error(message.error));
      }
    });

    worker.on('error', (error) => {
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

