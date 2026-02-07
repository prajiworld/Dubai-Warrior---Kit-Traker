import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  isOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen = false }) => {
  const [isSectionOpen, setSectionOpen] = useState(isOpen);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        onClick={() => setSectionOpen(!isSectionOpen)}
        className="w-full flex justify-between items-center p-4 font-bold text-lg text-gray-900 dark:text-white"
      >
        {title}
        {isSectionOpen ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
      </button>
      {isSectionOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
