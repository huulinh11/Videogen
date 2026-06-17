import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AccountPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editActive, setEditActive] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Change password
  const [showChangePass, setShowChangePass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const loadKeys = async () => {
    try {
      const data = await api.getKeys();
      setKeys(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleAdd = async () => {
    setError('');
    setSuccess('');
    if (!newKeyValue.trim()) {
      setError('API Key value is required');
      return;
    }
    try {
      await api.createKey(newKeyValue.trim(), newKeyLabel.trim());
      setNewKeyValue('');
      setNewKeyLabel('');
      setAddMode(false);
      setSuccess('API Key added successfully!');
      await loadKeys();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    setSuccess('');
    try {
      await api.updateKey(id, {
        key_value: editValue,
        label: editLabel,
        is_active: editActive,
      });
      setEditingKey(null);
      setSuccess('API Key updated successfully!');
      await loadKeys();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this API Key?')) return;
    try {
      await api.deleteKey(id);
      setSuccess('API Key deleted successfully!');
      await loadKeys();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async () => {
    setPassError('');
    setPassSuccess('');
    if (!currentPass || !newPass) {
      setPassError('Both fields are required');
      return;
    }
    try {
      await api.changePassword(currentPass, newPass);
      setPassSuccess('Password changed successfully!');
      setCurrentPass('');
      setNewPass('');
    } catch (err) {
      setPassError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white">Account Settings</h1>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{success}</div>
      )}

      {/* API Keys Section */}
      <div className="bg-glass border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">API Keys</h2>
          <button
            onClick={() => setAddMode(!addMode)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            + Add Key
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Add your API keys from videogen.web.id. Keys should start with <code className="bg-white/5 px-1 py-0.5 rounded text-emerald-400">vdgen-</code>.
          You can also enter a cookie value if needed.
        </p>

        {/* Add Form */}
        {addMode && (
          <div className="mb-4 p-4 bg-black/20 border border-emerald-500/20 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Add New API Key</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">API Key *</label>
              <input
                type="text"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="vdgen-xxxxxxx or cookie value"
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Label (Optional)</label>
              <input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="e.g. Main Account"
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Save Key
              </button>
              <button
                onClick={() => { setAddMode(false); setNewKeyValue(''); setNewKeyLabel(''); }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Keys List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto"></div>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No API keys configured. Click "+ Add Key" to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between gap-3"
              >
                {editingKey === key.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Label"
                      className="w-full bg-black/30 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={editActive === 1}
                        onChange={(e) => setEditActive(e.target.checked ? 1 : 0)}
                      />
                      Active
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(key.id)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded">
                        Save
                      </button>
                      <button onClick={() => setEditingKey(null)} className="px-3 py-1 bg-white/5 text-slate-400 text-xs rounded">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white truncate">
                          {key.key_value.substring(0, 8)}***{key.key_value.slice(-4)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${key.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                        {key.label && <span>{key.label}</span>}
                        <span>Jobs: {key.job_count || 0}</span>
                        <span>Quota: {key.quota ?? 'N/A'}</span>
                        <span>Added: {new Date(key.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingKey(key.id);
                          setEditValue(key.key_value);
                          setEditLabel(key.label || '');
                          setEditActive(key.is_active);
                        }}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-glass border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Change Password</h2>
          <button
            onClick={() => setShowChangePass(!showChangePass)}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {showChangePass ? 'Cancel' : 'Change'}
          </button>
        </div>

        {passError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs mb-3">{passError}</div>
        )}
        {passSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs mb-3">{passSuccess}</div>
        )}

        {showChangePass && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Current Password</label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">New Password</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <button
              onClick={handleChangePassword}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
