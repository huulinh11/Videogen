import { useState, useEffect } from 'react';
import { api } from '../services/api';

const ENDPOINTS = [
  {
    id: 'generate',
    label: 'POST /api/generate',
    description: 'Create a video generation job',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'text', placeholder: 'vdgen-xxxxxxx', required: true },
      { name: 'model', label: 'Model', type: 'select', options: [
        'seedance', 'seedance-fast', 'kling-video', 'kling-motion', 'sora', 'veo', 'veo-fast', 'wan-video', 'wan-image-video'
      ], required: true },
      { name: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Describe your video...', required: true },
      { name: 'duration', label: 'Duration', type: 'number', placeholder: '5' },
      { name: 'resolution', label: 'Resolution', type: 'select', options: ['auto', '480p', '720p', '1080p', '4k'] },
      { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['auto', '16:9', '9:16', '1:1'] },
      { name: 'image_url', label: 'Image URL (for I2V)', type: 'text', placeholder: 'https://...' },
      { name: 'video_url', label: 'Video URL (for kling-motion)', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    id: 'job-status',
    label: 'GET /api/jobs/{job_id}',
    description: 'Check job status',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'text', placeholder: 'vdgen-xxxxxxx', required: true },
      { name: 'job_id', label: 'Job ID', type: 'text', placeholder: 'Enter job ID', required: true },
    ],
  },
  {
    id: 'upload',
    label: 'POST /api/upload',
    description: 'Upload media file (base64)',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'text', placeholder: 'vdgen-xxxxxxx', required: true },
      { name: 'file', label: 'File', type: 'file', required: true },
    ],
  },
];

export default function ApiTestPage() {
  const [activeEndpoint, setActiveEndpoint] = useState(ENDPOINTS[0]);
  const [formValues, setFormValues] = useState({});
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedKeys, setSavedKeys] = useState([]);
  const [useProxy, setUseProxy] = useState(true);

  useEffect(() => {
    api.getSavedKeys().then(setSavedKeys).catch(() => {});
  }, []);

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      if (activeEndpoint.id === 'generate') {
        const payload = { model: formValues.model };
        if (formValues.prompt) payload.prompt = formValues.prompt;
        if (formValues.duration) payload.duration = Number(formValues.duration);
        if (formValues.resolution && formValues.resolution !== 'auto') payload.resolution = formValues.resolution;
        if (formValues.aspect_ratio && formValues.aspect_ratio !== 'auto') payload.aspect_ratio = formValues.aspect_ratio;
        if (formValues.image_url) payload.image_url = formValues.image_url;
        if (formValues.video_url) payload.video_url = formValues.video_url;

        const result = useProxy
          ? await api.generate(payload)
          : await api.testGenerate(formValues.api_key, payload);
        setResponse({ type: 'success', data: result, elapsed: result.elapsed_ms });
      } else if (activeEndpoint.id === 'job-status') {
        const result = await api.testJobStatus(
          formValues.api_key,
          formValues.job_id
        );
        setResponse({ type: 'success', data: result, elapsed: result.elapsed_ms });
      } else if (activeEndpoint.id === 'upload') {
        // File upload test
        const file = formValues._file;
        if (!file) {
          setResponse({ type: 'error', data: { error: 'Please select a file' } });
          setLoading(false);
          return;
        }
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await api.testUpload(
          formValues.api_key,
          file.name,
          file.type,
          base64.split(',')[1]
        );
        setResponse({ type: 'success', data: result, elapsed: result.elapsed_ms });
      }
    } catch (err) {
      setResponse({ type: 'error', data: { error: err.message } });
    }
    setLoading(false);
  };

  const prettyJson = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white">API Test Console</h1>
      <p className="text-sm text-slate-400">
        Test API calls directly against videogen.web.id or through your local proxy.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Endpoint Selector */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Endpoints</h2>
            <div className="space-y-1">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => { setActiveEndpoint(ep); setFormValues({}); setResponse(null); }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                    activeEndpoint.id === ep.id
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold">{ep.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{ep.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Proxy Toggle */}
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="accent-emerald-500"
              />
              <span className="text-xs text-slate-300">Use Local Proxy</span>
            </label>
            <p className="text-[10px] text-slate-500 mt-1">
              {useProxy ? 'Routes through backend (uses saved keys)' : 'Direct API call (requires explicit API key)'}
            </p>
          </div>

          {/* Saved Keys */}
          {savedKeys.length > 0 && (
            <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
              <h2 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Saved Keys</h2>
              <div className="space-y-1">
                {savedKeys.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => handleFieldChange('api_key', k.key_value.replace(/\*+/g, ''))}
                    className="w-full text-left p-2 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    title={k.key_value}
                  >
                    {k.key_value} {k.label && `(${k.label})`}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 mt-1">Click to use (keys are masked)</p>
            </div>
          )}
        </div>

        {/* Request Form + Response */}
        <div className="flex-1 space-y-4">
          <div className="bg-glass border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">{activeEndpoint.label}</h2>
            <p className="text-xs text-slate-400 mb-4">{activeEndpoint.description}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {activeEndpoint.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formValues[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                    >
                      <option value="">-- Select --</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formValues[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      rows={3}
                      placeholder={field.placeholder}
                      className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 resize-none"
                    />
                  ) : field.type === 'file' ? (
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFieldChange('_file', file);
                      }}
                      className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-emerald-600 file:text-white file:font-bold hover:file:bg-emerald-500 file:cursor-pointer"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formValues[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 font-mono"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Sending...
                  </span>
                ) : (
                  '🚀 Send Request'
                )}
              </button>
            </form>
          </div>

          {/* Response */}
          {response && (
            <div className="bg-glass border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Response</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  response.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {response.type === 'success' ? 'OK' : 'Error'}
                  {response.data?.status != null ? ` (${response.data.status})` : ''}
                </span>
                {response.elapsed != null && (
                  <span className="text-[10px] text-slate-500 font-mono">{response.elapsed}ms</span>
                )}
              </div>
              <pre className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-all">
                {prettyJson(response.type === 'success' ? (response.data?.response || response.data) : response.data)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
