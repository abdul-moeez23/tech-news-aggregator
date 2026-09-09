import React from 'react';

export default function DeleteModal({ isOpen, onClose, onConfirm, sourceName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-primary rounded-xl shadow-xl max-w-sm w-full p-6 border border-border-subtle transform transition-all">
        <h3 className="text-xl font-bold text-text-primary mb-2">Delete Source</h3>
        <p className="text-text-secondary text-sm mb-6">
          Are you sure you want to delete <strong>{sourceName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
