import React from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Hapus Data',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-700',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          border: 'border-amber-200',
        };
      case 'primary':
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
          border: 'border-emerald-200',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 text-rose-700',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          border: 'border-rose-200',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfirmasi tindakan
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5 ${styles.btnBg}`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
