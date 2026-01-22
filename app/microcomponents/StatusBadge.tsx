
import React from 'react';

interface StatusBadgeProps {
  label: string;
  type?: 'priority' | 'status' | 'default';
  variant?: 'High' | 'Medium' | 'Low' | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'default', variant }) => {
  const getStyles = () => {
    if (type === 'priority') {
      switch (variant) {
        case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
        case 'Medium': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        case 'Low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        default: return 'text-muted-foreground bg-muted border-border';
      }
    }
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-black uppercase border ${getStyles()} transition-colors`}>
      {label}
    </span>
  );
};

export default StatusBadge;
