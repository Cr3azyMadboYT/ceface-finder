import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Crown } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  message?: string;
}

const UpgradeModal: React.FC<Props> = ({ open, onClose, message }) => {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl card-gradient border border-border/50 p-6 relative animate-slide-up">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon mb-4">
          <Crown className="w-6 h-6 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold font-heading text-foreground mb-1">Ai nevoie de un plan mai mare</h3>
        <p className="text-sm text-muted-foreground mb-5">
          {message || 'Această funcție este disponibilă într-un plan superior.'}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium">
            Anulează
          </button>
          <button onClick={() => { onClose(); navigate('/business/plans'); }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon">
            Vezi planuri
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
