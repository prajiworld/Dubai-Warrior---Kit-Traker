import React from 'react';
import { KitStatus } from '../types';

interface StatusBadgeProps {
  status: KitStatus;
}

const statusStyles: Record<KitStatus, { base: string; text: string; }> = {
  [KitStatus.Completed]: { base: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  [KitStatus.Upcoming]: { base: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  [KitStatus.Missed]: { base: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
  [KitStatus.NoPlay]: { base: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status] || statusStyles[KitStatus.Upcoming];
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style.base} ${style.text}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
