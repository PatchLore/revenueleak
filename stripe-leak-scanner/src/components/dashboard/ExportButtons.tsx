'use client';

import { useState } from 'react';

interface ExportButtonsProps {
  scanId: string;
  plan: string | null;
}

export function ExportButtons({ scanId, plan }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleCsvExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/scan/${scanId}/export-csv`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-intelligence-${scanId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const isFree = plan === 'free' || !plan;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCsvExport}
        disabled={isFree || isExporting}
        className={
          isFree
            ? 'cursor-not-allowed opacity-50 bg-gray-700 text-gray-400 px-6 py-4 rounded-lg font-bold transition'
            : 'bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-bold transition'
        }
      >
        {isExporting ? 'Exporting…' : '📥 Download CSV'}
      </button>
      {isFree && (
        <span className="text-sm text-gray-500">Upgrade to export</span>
      )}
    </div>
  );
}
