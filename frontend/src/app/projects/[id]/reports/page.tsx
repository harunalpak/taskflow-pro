'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dayjs from 'dayjs';
import api from '@/lib/api';

interface Report {
  id: string;
  reportType: string;
  status: string;
  summary: any;
  requestedAt: string;
  completedAt: string | null;
  user: {
    name: string;
    email: string;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchSummary();
    // Poll for updates
    const interval = setInterval(() => {
      fetchReports();
    }, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const response = await api.get(`/reports/projects/${projectId}/reports`);
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/reports/projects/${projectId}/summary`);
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await api.post(`/reports/projects/${projectId}/reports`, {
        reportType: 'WEEKLY',
      });
      fetchReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="text-gray-700 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Project Reports</h2>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Weekly Report'}
            </button>
          </div>

          {summary && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Do</p>
                  <p className="text-2xl font-bold text-gray-600">{summary.todo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{summary.overdue}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Reports</h3>
              {reports.length === 0 ? (
                <p className="text-gray-500">No reports generated yet.</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {report.reportType} Report
                          </h4>
                          <p className="text-sm text-gray-500">
                            Requested by {report.user.name} on{' '}
                            {dayjs(report.requestedAt).format('MMM DD, YYYY HH:mm')}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            report.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : report.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800'
                              : report.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      {report.summary && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(report.summary, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

