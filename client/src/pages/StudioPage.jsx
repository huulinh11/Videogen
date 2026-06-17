import { useState, useRef, useCallback, useEffect } from 'react';
import { MODELS, getModel } from '../config/models';
import { api } from '../services/api';

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudioPage() {
  const [models, setModels] = useState(MODELS);
  const [selectedModel, setSelectedModel] = useState('seedance');
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text-to-video');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('auto');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Upload states
  const [startImage, setStartImage] = useState(null);
  const [endImage, setEndImage] = useState(null);
  const [characterPhoto, setCharacterPhoto] = useState(null);
  const [motionVideo, setMotionVideo] = useState(null);
  const [consistencyImages, setConsistencyImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Job states
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pollingRefs = useRef({});

  useEffect(() => {
    api.getModels().then(setModels).catch(() => setModels(MODELS));
  }, []);

  const currentModel = getModel(selectedModel);

  const uploadFile = useCallback(async (file, type) => {
    try {
      const base64 = await readFileAsBase64(file);
      const data = await api.upload(file.name, file.type, base64.split(',')[1]);
      return data.url;
    } catch (err) {
      throw new Error(`Upload failed: ${err.message}`);
    }
  }, []);

  const handleStartImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStartImage({ file, localUrl: URL.createObjectURL(file), status: 'uploading' });
    try {
      const url = await uploadFile(file);
      setStartImage((prev) => prev && { ...prev, uploadUrl: url, status: 'ready' });
    } catch (err) {
      setStartImage((prev) => prev && { ...prev, status: 'failed' });
    }
  };

  const handleEndImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEndImage({ file, localUrl: URL.createObjectURL(file), status: 'uploading' });
    try {
      const url = await uploadFile(file);
      setEndImage((prev) => prev && { ...prev, uploadUrl: url, status: 'ready' });
    } catch (err) {
      setEndImage((prev) => prev && { ...prev, status: 'failed' });
    }
  };

  const handleCharacterPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCharacterPhoto({ file, localUrl: URL.createObjectURL(file), status: 'uploading' });
    try {
      const url = await uploadFile(file);
      setCharacterPhoto((prev) => prev && { ...prev, uploadUrl: url, status: 'ready' });
    } catch (err) {
      setCharacterPhoto((prev) => prev && { ...prev, status: 'failed' });
    }
  };

  const handleMotionVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMotionVideo({ file, localUrl: URL.createObjectURL(file), status: 'uploading' });
    try {
      const url = await uploadFile(file);
      setMotionVideo((prev) => prev && { ...prev, uploadUrl: url, status: 'ready' });
    } catch (err) {
      setMotionVideo((prev) => prev && { ...prev, status: 'failed' });
    }
  };

  const handleConsistencyImages = async (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      file,
      localUrl: URL.createObjectURL(file),
      status: 'uploading',
    }));
    setConsistencyImages((prev) => [...prev, ...newImages]);

    for (const img of newImages) {
      try {
        const url = await uploadFile(img.file);
        setConsistencyImages((prev) =>
          prev.map((ci) => (ci.id === img.id ? { ...ci, uploadUrl: url, status: 'ready' } : ci))
        );
      } catch {
        setConsistencyImages((prev) =>
          prev.map((ci) => (ci.id === img.id ? { ...ci, status: 'failed' } : ci))
        );
      }
    }
  };

  const removeConsistencyImage = (id) => {
    setConsistencyImages((prev) => prev.filter((img) => img.id !== id));
  };

  const buildPayload = () => {
    const model = selectedModel;
    const payload = { model };

    if (model === 'seedance' || model === 'seedance-fast') {
      payload.prompt = prompt.trim();
      if (model === 'seedance') payload.duration = duration;
      if (resolution !== 'auto') payload.resolution = resolution;
      if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio;

      if (mode === 'image-to-video') {
        if (!startImage?.uploadUrl) throw new Error('Start image is required for Image-to-Video mode');
        payload.image_url = startImage.uploadUrl;
        if (endImage?.uploadUrl) payload.end_image_url = endImage.uploadUrl;
      } else if (mode === 'consistency') {
        const refUrls = consistencyImages.filter((ci) => ci.status === 'ready').map((ci) => ci.uploadUrl);
        if (refUrls.length === 0) throw new Error('At least 1 reference image is required for Consistency mode');
        payload.reference_image_urls = refUrls.slice(0, 9);
      }
    } else if (model === 'kling-video') {
      payload.prompt = prompt.trim();
      payload.duration = duration;
      payload.aspect_ratio = aspectRatio;
      if (mode === 'image-to-video') {
        if (!startImage?.uploadUrl) throw new Error('Start image is required');
        payload.image_url = startImage.uploadUrl;
        if (endImage?.uploadUrl) payload.end_image_url = endImage.uploadUrl;
      }
    } else if (model === 'kling-motion') {
      if (!characterPhoto?.uploadUrl) throw new Error('Character photo is required');
      if (!motionVideo?.uploadUrl) throw new Error('Motion video is required');
      payload.image_url = characterPhoto.uploadUrl;
      payload.video_url = motionVideo.uploadUrl;
      if (prompt.trim()) payload.prompt = prompt.trim();
    } else if (model === 'sora') {
      payload.prompt = prompt.trim();
      payload.duration = duration;
      payload.aspect_ratio = aspectRatio;
      if (mode === 'image-to-video') {
        if (!startImage?.uploadUrl) throw new Error('First frame photo is required');
        payload.image_url = startImage.uploadUrl;
      }
    } else if (model === 'veo' || model === 'veo-fast') {
      payload.prompt = prompt.trim();
      payload.duration = duration;
      if (resolution !== 'auto') payload.resolution = resolution;
      if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio;
      if (mode === 'image-to-video') {
        if (!startImage?.uploadUrl) throw new Error('Start image is required');
        payload.image_url = startImage.uploadUrl;
        if (endImage?.uploadUrl) payload.end_image_url = endImage.uploadUrl;
      }
    } else if (model === 'wan-video') {
      payload.prompt = prompt.trim();
      payload.duration = duration;
      if (resolution !== 'auto') payload.resolution = resolution;
      if (aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio;
    } else if (model === 'wan-image-video') {
      if (!startImage?.uploadUrl) throw new Error('Start image is required');
      payload.prompt = prompt.trim();
      payload.image_url = startImage.uploadUrl;
      payload.duration = duration;
      if (resolution !== 'auto') payload.resolution = resolution;
      if (endImage?.uploadUrl) payload.end_image_url = endImage.uploadUrl;
    }

    return payload;
  };

  const startPolling = (jobId) => {
    if (pollingRefs.current[jobId]) clearInterval(pollingRefs.current[jobId]);

    pollingRefs.current[jobId] = setInterval(async () => {
      try {
        const data = await api.getJob(jobId);

        if (data.status === 'done' || data.status === 'completed') {
          clearInterval(pollingRefs.current[jobId]);
          delete pollingRefs.current[jobId];

          setJobs((prev) =>
            prev.map((j) =>
              j.job_id === jobId ? { ...j, status: 'done', result_url: data.url, progress: 100 } : j
            )
          );
          setActiveJob((prev) =>
            prev?.job_id === jobId
              ? { ...prev, status: 'done', result_url: data.url, progress: 100 }
              : prev
          );
          setGenerating(false);
        } else if (data.status === 'failed' || data.status === 'error') {
          clearInterval(pollingRefs.current[jobId]);
          delete pollingRefs.current[jobId];

          setJobs((prev) =>
            prev.map((j) =>
              j.job_id === jobId
                ? { ...j, status: 'failed', error: data.error || 'Processing failed' }
                : j
            )
          );
          setActiveJob((prev) =>
            prev?.job_id === jobId
              ? { ...prev, status: 'failed', error: data.error || 'Processing failed' }
              : prev
          );
          setGenerating(false);
        } else {
          const progress = data.progress != null ? (data.progress <= 1 ? Math.round(data.progress * 100) : data.progress) : undefined;
          setJobs((prev) =>
            prev.map((j) => (j.job_id === jobId ? { ...j, progress: progress || j.progress + 2, status: 'processing' } : j))
          );
          setActiveJob((prev) =>
            prev?.job_id === jobId ? { ...prev, progress: progress || (prev.progress || 10) + 2 } : prev
          );
        }
      } catch (err) {
        // Keep polling silently
      }
    }, 4500);
  };

  const handleGenerate = async () => {
    setError('');
    setSuccessMsg('');

    if (!prompt.trim() && selectedModel !== 'kling-motion') {
      setError('Please enter a prompt description');
      return;
    }

    // Check uploads
    const uploadingAssets =
      startImage?.status === 'uploading' ||
      endImage?.status === 'uploading' ||
      characterPhoto?.status === 'uploading' ||
      motionVideo?.status === 'uploading' ||
      consistencyImages.some((ci) => ci.status === 'uploading');

    if (uploadingAssets) {
      setError('Media files are still uploading. Please wait...');
      return;
    }

    try {
      const payload = buildPayload();
      setGenerating(true);

      const queuedJob = {
        id: `queued_${Date.now()}`,
        prompt: selectedModel === 'kling-motion' ? (prompt.trim() || 'Kling Motion Transfer') : prompt.trim(),
        model: selectedModel,
        mode,
        status: 'queued',
        progress: 0,
        payload,
      };

      setJobs((prev) => [...prev, queuedJob]);
      setActiveJob(queuedJob);

      const result = await api.generate(payload);
      const jobId = result.job_id;

      setJobs((prev) =>
        prev.map((j) =>
          j.id === queuedJob.id ? { ...j, job_id: jobId, status: 'processing', progress: 10 } : j
        )
      );
      setActiveJob((prev) =>
        prev?.id === queuedJob.id
          ? { ...prev, job_id: jobId, status: 'processing', progress: 10 }
          : prev
      );

      startPolling(jobId);
      setSuccessMsg(`Job created: ${jobId}`);
    } catch (err) {
      setError(err.message || 'Failed to start generation');
      setGenerating(false);
    }
  };

  const handleCancel = () => {
    // Stop all polling
    Object.keys(pollingRefs.current).forEach((key) => {
      clearInterval(pollingRefs.current[key]);
    });
    pollingRefs.current = {};

    if (activeJob) {
      setJobs((prev) =>
        prev.map((j) =>
          j.job_id === activeJob.job_id
            ? { ...j, status: 'failed', error: 'Cancelled by user' }
            : j
        )
      );
      setActiveJob((prev) => (prev ? { ...prev, status: 'failed', error: 'Cancelled by user' } : null));
    }
    setGenerating(false);
  };

  const clearJob = () => {
    setActiveJob(null);
    setGenerating(false);
  };

  const colorMap = {
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    yellow: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Sidebar */}
      <aside className="w-full lg:w-96 shrink-0 space-y-4">
        <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Model</h2>
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModel(m.id);
                  setMode(m.modes[0]);
                  setStartImage(null);
                  setEndImage(null);
                  setCharacterPhoto(null);
                  setMotionVideo(null);
                  setConsistencyImages([]);
                }}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  selectedModel === m.id
                    ? `${colorMap[m.color] || 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`
                    : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                }`}
              >
                <div className="font-bold">{m.label}</div>
                {m.badge && (
                  <span className="text-[9px] opacity-70 uppercase">{m.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Model Description */}
        <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-slate-400">{currentModel.description}</p>
        </div>

        {/* Mode Selection */}
        {currentModel.modes.length > 1 && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Mode</h2>
            <div className="flex gap-2">
              {currentModel.modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === m
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-black/20 border border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'text-to-video' ? 'Text→Video' : m === 'image-to-video' ? 'Image→Video' : 'Consistency'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt */}
        {(selectedModel !== 'kling-motion' || true) && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              {selectedModel === 'kling-motion' ? 'Prompt (Optional)' : 'Prompt *'}
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 resize-none"
              placeholder="Describe your video scene in detail..."
            />
          </div>
        )}

        {/* Duration */}
        {currentModel.supportsDuration && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Duration</h2>
            <div className="flex gap-2">
              {(currentModel.durationOptions || [5, 10, 15]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    duration === d
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-black/20 border border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resolution */}
        {currentModel.supportsResolution && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Resolution</h2>
            <div className="flex gap-2 flex-wrap">
              {(currentModel.resolutionOptions || ['auto', '720p', '1080p']).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    resolution === r
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-black/20 border border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aspect Ratio */}
        {currentModel.supportsAspectRatio && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Aspect Ratio</h2>
            <div className="flex gap-2">
              {(currentModel.aspectRatioOptions || ['16:9', '9:16', '1:1']).map((a) => (
                <button
                  key={a}
                  onClick={() => setAspectRatio(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    aspectRatio === a
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-black/20 border border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Uploads */}
        {(mode === 'image-to-video' ||
          selectedModel === 'kling-motion' ||
          mode === 'consistency') && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              {selectedModel === 'kling-motion' ? 'Character & Motion' : 'Media Uploads'}
            </h2>

            {selectedModel === 'kling-motion' ? (
              <div className="space-y-3">
                {/* Character Photo */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Character Photo *</span>
                  <label className="mt-1 block cursor-pointer">
                    {characterPhoto ? (
                      <div className="relative rounded-lg overflow-hidden aspect-video border border-emerald-500/20 bg-black/40">
                        {characterPhoto.file.type.startsWith('image/') ? (
                          <img src={characterPhoto.localUrl} alt="Character" className="w-full h-full object-cover" />
                        ) : (
                          <video src={characterPhoto.localUrl} className="w-full h-full object-cover" />
                        )}
                        {characterPhoto.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg aspect-video border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-1 hover:border-emerald-500/30 transition-colors">
                        <span className="text-xl">📷</span>
                        <span className="text-[10px] text-slate-500">Add Photo</span>
                      </div>
                    )}
                    <input type="file" onChange={handleCharacterPhoto} accept="image/*" className="hidden" />
                  </label>
                </div>

                {/* Motion Video */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Reference Motion Video *</span>
                  <label className="mt-1 block cursor-pointer">
                    {motionVideo ? (
                      <div className="relative rounded-lg overflow-hidden aspect-video border border-emerald-500/20 bg-black/40">
                        <video src={motionVideo.localUrl} className="w-full h-full object-cover" />
                        {motionVideo.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg aspect-video border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-1 hover:border-emerald-500/30 transition-colors">
                        <span className="text-xl">🎥</span>
                        <span className="text-[10px] text-slate-500">Add Video</span>
                      </div>
                    )}
                    <input type="file" onChange={handleMotionVideo} accept="video/*" className="hidden" />
                  </label>
                </div>
              </div>
            ) : mode === 'consistency' ? (
              <div>
                <span className="text-[10px] font-bold text-slate-400">
                  Reference Images ({consistencyImages.length}/{currentModel.maxConsistencyImages || 9})
                </span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {consistencyImages.map((img) => (
                    <div key={img.id} className="relative rounded-lg overflow-hidden aspect-square border border-white/10 bg-black/40">
                      <img src={img.localUrl} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeConsistencyImage(img.id)}
                        className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer rounded-lg aspect-square border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-0.5 hover:border-emerald-500/30 transition-colors">
                    <span className="text-lg">+</span>
                    <span className="text-[8px] text-slate-500">Add</span>
                    <input type="file" onChange={handleConsistencyImages} accept="image/*" multiple className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Start Frame */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Start Frame *</span>
                  <label className="mt-1 block cursor-pointer">
                    {startImage ? (
                      <div className="relative rounded-lg overflow-hidden aspect-video border border-emerald-500/20 bg-black/40">
                        <img src={startImage.localUrl} alt="Start" className="w-full h-full object-cover" />
                        {startImage.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg aspect-video border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-1 hover:border-emerald-500/30 transition-colors">
                        <span className="text-xl">🖼️</span>
                        <span className="text-[10px] text-slate-500">Upload Image</span>
                      </div>
                    )}
                    <input type="file" onChange={handleStartImage} accept="image/*" className="hidden" />
                  </label>
                </div>

                {/* End Frame (optional) */}
                {currentModel.supportsEndFrame && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">End Frame (Optional)</span>
                    <label className="mt-1 block cursor-pointer">
                      {endImage ? (
                        <div className="relative rounded-lg overflow-hidden aspect-video border border-emerald-500/20 bg-black/40">
                          <img src={endImage.localUrl} alt="End" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="rounded-lg aspect-video border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-1 hover:border-emerald-500/30 transition-colors">
                          <span className="text-xl">🖼️</span>
                          <span className="text-[10px] text-slate-500">Upload End Frame</span>
                        </div>
                      )}
                      <input type="file" onChange={handleEndImage} accept="image/*" className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Generating...
            </span>
          ) : (
            '⚡ Generate Video'
          )}
        </button>

        {generating && (
          <button
            onClick={handleCancel}
            className="w-full bg-red-500/15 border border-red-500/20 text-red-400 py-2 rounded-xl font-bold text-xs transition-all hover:bg-red-500/25"
          >
            Cancel Generation
          </button>
        )}

        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">{successMsg}</div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Active Job Preview */}
        {activeJob && (
          <div className="bg-glass border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {activeJob.status === 'done'
                ? 'Video Created Successfully! 🎉'
                : activeJob.status === 'failed'
                ? 'Generation Failed ❌'
                : `Rendering ${getModel(activeJob.model).label}...`}
            </h2>

            {/* Progress Bar */}
            {activeJob.status === 'processing' && (
              <div className="mb-4">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(activeJob.progress || 10, 95)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  {activeJob.progress || 10}% - Processing your video...
                </p>
              </div>
            )}

            {/* Video Preview */}
            {activeJob.status === 'done' && activeJob.result_url && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl mb-4">
                <video
                  src={activeJob.result_url}
                  controls
                  autoPlay
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
            )}

            {/* Error */}
            {activeJob.status === 'failed' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
                {activeJob.error || 'Unknown error occurred'}
              </div>
            )}

            {/* Job Info */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-white/5 text-slate-400 font-mono">
                Model: {getModel(activeJob.model).label}
              </span>
              <span className="px-2 py-1 rounded bg-white/5 text-slate-400 font-mono">
                Mode: {activeJob.mode}
              </span>
              {activeJob.job_id && (
                <span className="px-2 py-1 rounded bg-white/5 text-slate-400 font-mono">
                  Job: {activeJob.job_id.substring(0, 16)}...
                </span>
              )}
              <button onClick={clearJob} className="px-2 py-1 rounded bg-white/5 text-slate-400 hover:text-white transition-colors">
                Clear
              </button>
              {activeJob.result_url && (
                <a
                  href={activeJob.result_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!activeJob && (
          <div className="bg-glass border border-white/10 rounded-2xl p-12 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-5xl mb-4">🎬</span>
            <h3 className="text-lg font-bold text-white mb-2">Ready to Create</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Select a model on the left, write your prompt, and click Generate to bring your idea to life.
            </p>
          </div>
        )}

        {/* Job History */}
        {jobs.length > 0 && (
          <div className="bg-glass border border-white/10 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Recent Jobs</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[...jobs].reverse().slice(0, 10).map((job, idx) => (
                <div
                  key={job.id || idx}
                  onClick={() => job.status !== 'queued' && setActiveJob(job)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeJob?.id === job.id
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">
                      {job.status === 'done' ? '✅' : job.status === 'failed' ? '❌' : job.status === 'processing' ? '🔄' : '⏳'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{job.prompt || 'No prompt'}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{getModel(job.model).label}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase shrink-0 ${
                    job.status === 'done' ? 'text-emerald-400' : job.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
