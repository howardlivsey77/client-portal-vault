
import React from 'react';

type CompanyAccessCardProps = {
  variant: 'checking' | 'success' | 'warning';
  children: React.ReactNode;
};

export const CompanyAccessCard = ({ variant, children }: CompanyAccessCardProps) => {
  const getCardStyles = () => {
    switch (variant) {
      case 'checking':
        return 'bg-gray-50 border border-gray-200';
      case 'success':
        return 'bg-green-50 border border-green-200';
      case 'warning':
        return 'bg-yellow-50 border border-yellow-200';
      default:
        return 'bg-gray-50 border border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-md ${getCardStyles()}`}>
      {children}
    </div>
  );
};
