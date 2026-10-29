import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Settings, 
  FileSpreadsheet, 
  Database, 
  Trash2, 
  UserCheck, 
  Printer, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail?: string;
}

export interface ProgressSummaryItem {
  label: string;
  value: string | number;
  badge?: string;
}

export interface ProgressResultSummary {
  title: string;
  items: ProgressSummaryItem[];
  note?: string;
}

export interface ProgressModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  icon?: 'settings' | 'excel' | 'database' | 'trash' | 'user' | 'printer';
  steps: ProgressStep[];
  progressPercent: number; // 0 to 100
  currentDetail?: string;
  status: 'running' | 'completed' | 'error';
  errorMessage?: string;
  resultSummary?: ProgressResultSummary;
  onClose?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  title,
  subtitle,
  icon = 'settings',
  steps,
  progressPercent,
  currentDetail,
  status,
  errorMessage,
  resultSummary,
  onClose,
  primaryAction,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (icon) {
      case 'excel':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
      case 'database':
        return <Database className="w-6 h-6 text-sky-600" />;
      case 'trash':
        return <Trash2 className="w-6 h-6 text-rose-600" />;
      case 'user':
        return <UserCheck className="w-6 h-6 text-indigo-600" />;
      case 'printer':
        return <Printer className="w-6 h-6 text-amber-600" />;
      case 'settings':
      default:
        return <Settings className="w-6 h-6 text-blue-600" />;
    }
  };

  const getHeaderBadge = () => {
    if (status === 'running') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Sedang Diproses
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Berhasil Disimpan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5" />
        Terjadi Kendala
      </span>
    );
  };

  const safePercent = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
              {renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                  {title}
                </h3>
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {getHeaderBadge()}
            {status !== 'running' && onClose && (
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Progress Bar & Numerical Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                {status === 'running' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                )}
                Progres Operasi
              </span>
              <span className="font-extrabold font-mono text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                {safePercent}%
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 border border-slate-200/80 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
                  status === 'error'
                    ? 'bg-rose-500'
                    : status === 'completed'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${safePercent}%` }}
              >
                {status === 'running' && (
                  <div className="absolute inset-0 bg-white/25 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent w-full" />
                )}
              </div>
            </div>

            {/* Current Active Subtitle / Detail ticker */}
            {currentDetail && (
              <p className="text-xs text-slate-600 font-medium truncate pt-1 flex items-center gap-1.5">
                <span className="text-slate-400">Status:</span>
                <span className="text-slate-800 font-semibold">{currentDetail}</span>
              </p>
            )}
          </div>

          {/* Steps Checklist */}
          {steps && steps.length > 0 && (
            <div className="border border-slate-200/80 rounded-2xl bg-slate-50/70 p-3.5 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tahapan Pembaruan
              </p>
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  let stepIcon = <Clock className="w-4 h-4 text-slate-300 shrink-0" />;
                  let textClass = 'text-slate-400 font-normal';
                  let bgPill = 'bg-transparent';

                  if (step.status === 'completed') {
                    stepIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
                    textClass = 'text-slate-700 font-medium';
                  } else if (step.status === 'running') {
                    stepIcon = <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />;
                    textClass = 'text-blue-900 font-bold';
                    bgPill = 'bg-blue-50/80 px-2 py-1 rounded-xl border border-blue-100';
                  } else if (step.status === 'error') {
                    stepIcon = <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
                    textClass = 'text-rose-700 font-medium';
                  }

                  return (
                    <div 
                      key={step.id || idx}
                      className={`flex items-start gap-2.5 text-xs transition-colors ${bgPill}`}
                    >
                      <div className="pt-0.5">{stepIcon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={textClass}>
                          {step.label}
                        </p>
                        {step.detail && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {step.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {status === 'error' && errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Melakukan Pembaruan</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Result Summary Box (When Finished) */}
          {status === 'completed' && resultSummary && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs text-emerald-900">
                  {resultSummary.title || 'Ringkasan Hasil Perubahan'}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {resultSummary.items.map((item, i) => (
                  <div key={i} className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] text-slate-500">{item.label}</p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                      {item.value}
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {resultSummary.note && (
                <p className="text-[11px] text-emerald-700 font-medium italic">
                  💡 {resultSummary.note}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
          {status === 'running' ? (
            <p className="text-xs text-slate-500 flex items-center gap-2 mr-auto font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Mohon tunggu, proses sedang berlangsung...
            </p>
          ) : (
            <>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              )}

              {primaryAction && status === 'completed' && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  {primaryAction.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
