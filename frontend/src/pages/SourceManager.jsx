import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Layout from '../components/Layout';
import DeleteModal from '../components/DeleteModal';

export default function SourceManager() {
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, sourceId: null, sourceName: '' });

  const [enabledIds, setEnabledIds] = useState([]);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const [srcRes, prefRes] = await Promise.all([
        api.get('/sources/'),
        api.get('/preferences/')
      ]);
      setSources(srcRes.data);
      setEnabledIds(prefRes.data.sources || []);
    } catch (error) {
      console.error("Failed to fetch sources", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) return;
    
    try {
      const res = await api.post('/sources/', {
        name: newSource.name,
        url: newSource.url,
        is_active: true
      });
      setSources([...sources, res.data]);
      setEnabledIds([...enabledIds, res.data.id]);
      setNewSource({ name: '', url: '' });
    } catch (error) {
      console.error("Failed to add source", error);
    }
  };

  const toggleSourceActive = async (id, current_status) => {
    try {
      const res = await api.patch(`/sources/${id}/`, { is_active: !current_status });
      setSources(sources.map(src => 
        src.id === id ? res.data : src
      ));
    } catch (error) {
      console.error("Failed to update source", error);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModalState({ isOpen: true, sourceId: id, sourceName: name });
  };

  const confirmDelete = async () => {
    if (!deleteModalState.sourceId) return;
    try {
      await api.delete(`/sources/${deleteModalState.sourceId}/`);
      setSources(sources.filter(src => src.id !== deleteModalState.sourceId));
      setDeleteModalState({ isOpen: false, sourceId: null, sourceName: '' });
    } catch (error) {
      console.error("Failed to delete source", error);
    }
  };

  const displaySources = sources.filter(src => src.user !== null || enabledIds.includes(src.id));

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-1">Source Manager</h2>
        <p className="text-text-secondary text-sm mb-6">Manage your custom feeds and APIs.</p>
        
        <form onSubmit={handleAddSource} className="mb-6 p-5 bg-bg-card border border-border-subtle rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-text-primary mb-4">Add Custom Feed/API</h3>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-text-secondary mb-1">Source Name</label>
              <input 
                type="text" 
                placeholder="e.g. Hacker News"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="w-full bg-bg-primary border border-border-subtle text-text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>
            <div className="flex-[2] w-full">
              <label className="block text-xs font-medium text-text-secondary mb-1">RSS/API URL</label>
              <input 
                type="url" 
                placeholder="https://..."
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                className="w-full bg-bg-primary border border-border-subtle text-text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>
            <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-accent-blue to-accent-purple text-[#FAFAFA] px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Add Source
            </button>
          </div>
        </form>

        <div className="bg-bg-card border border-border-subtle p-5 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-text-primary mb-4">Managed Sources</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="p-3 font-semibold text-text-muted uppercase text-[11px] tracking-wider">Name</th>
                  <th className="p-3 font-semibold text-text-muted uppercase text-[11px] tracking-wider">URL</th>
                  <th className="p-3 text-center font-semibold text-text-muted uppercase text-[11px] tracking-wider">Status</th>
                  <th className="p-3 text-center font-semibold text-text-muted uppercase text-[11px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displaySources.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-6 text-sm text-text-muted">No sources configured.</td></tr>
                ) : (
                  displaySources.map(src => (
                    <tr key={src.id} className="border-b border-border-subtle hover:bg-bg-card-elevated transition-colors">
                      <td className="p-3 text-sm font-medium text-text-primary">{src.name}</td>
                      <td className="p-3 text-xs text-text-secondary truncate max-w-[200px]">{src.url}</td>
                      <td className="p-3 text-center">
                        {src.user !== null ? (
                          <button 
                            onClick={() => toggleSourceActive(src.id, src.is_active)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${src.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                          >
                            {src.is_active ? 'Active' : 'Disabled'}
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-500 cursor-default">Active (Global)</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {src.user !== null && (
                          <button 
                            onClick={() => handleDeleteClick(src.id, src.name)}
                            className="text-text-muted hover:text-red-500 font-medium transition-colors text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DeleteModal 
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, sourceId: null, sourceName: '' })}
        onConfirm={confirmDelete}
        sourceName={deleteModalState.sourceName}
      />
    </Layout>
  );
}
