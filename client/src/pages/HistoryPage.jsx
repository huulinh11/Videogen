import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getModel } from '../config/models';

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', model: '' });
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  const limit = 20;

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit, offset: page * limit };
      if (filter.status) params.status = filter.status;
      if (filter.model) params.model = filter.model;

      const data = await api.getJobs(params);
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job from history?')) return;
    try {
      await api.deleteJob(id);
      loadJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white">Job History</h1>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filter.status}
            onChange={(e) => { setFilter((f) => ({ ...f, status: e.target.value })); setPage(0); }}
            className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/40"
          >
            <option value="">All Status</option>
            <option value="done">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>

          <select
            value={filter.model}
            onChange={(e) => { setFilter((f) => ({ ...f, model: e.target.value })); setPage(0); }}
            className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/40"
          >
            <option value="">All Models</option>
            <option value="seedance">Seedance</option>
            <option value="seedance-fast">Seedance Fast</option>
            <option value="kling-video">Kling 3.0</option>
            <option value="kling-motion">Kling Motion</option>
            <option value="sora">Sora 2</option>
            <option value="veo">Veo 3.1</option>
            <option value="veo-fast">Veo 3.1 Fast</option>
            <option value="wan-video">Wan T2V</option>
            <option value="wan-image-video">Wan I2V</option>
          </select>

          <span className="text-xs text-slate-500">{total} total jobs</span>

          <button
            onClick={loadJobs}
            className="ml-auto px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-lg transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-glass border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No jobs found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-black/10">
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Job ID</th>
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Model</th>
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Prompt</th>
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Mode</th>
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Status</th>
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Created</th>
                    <th className="text-left p-3 text-slate-400 font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-slate-300 max-w-[100px] truncate" title={job.job_id}>
                        {job.job_id?.substring(0, 12)}...
                      </td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                          {getModel(job.model).label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-[200px] truncate" title={job.prompt}>
                        {job.prompt || '-'}
                      </td>
                      <td className="p-3 text-slate-500 uppercase text-[10px]">
                        {job.mode || '-'}
                      </td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.status === 'done' ? 'bg-emerald-500/15 text-emerald-400' :
                          job.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                          job.status === 'processing' ? 'bg-yellow-500/15 text-yellow-400' :
                          'bg-white/5 text-slate-400'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[10px]">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {job.result_url && (
                            <a
                              href={job.result_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-emerald-600 text-white text-[10px] rounded hover:bg-emerald-500 transition-colors"
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] rounded hover:bg-red-500/20 transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 p-4 border-t border-white/5">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
