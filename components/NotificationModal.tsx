import React from 'react';
import type { TeamMember } from '../types';
import { XCircleIcon, CheckCircleIcon, WhatsAppIcon } from './Icons';

interface NotificationModalProps {
  assignee: TeamMember;
  directMessage: string;
  groupMessage: string;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ assignee, directMessage, groupMessage, onClose }) => {

  const handleOpenWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace(/\+/g, '')}?text=${encodeURIComponent(directMessage)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75"
    >
      <div className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 id="notification-title" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Notify Player & Team
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Follow these two simple steps to keep everyone informed.
          </p>
        </div>

        <div className="mt-6 space-y-4">
            {/* Step 1 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mr-3" />
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Step 1: Group Message Copied</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            A message for the team group chat has been copied to your clipboard.
                        </p>
                        <blockquote className="mt-2 pl-3 border-l-4 border-gray-300 dark:border-gray-500 text-xs italic text-gray-500 dark:text-gray-400">
                           "{groupMessage}"
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start">
                     <div className="h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mr-3">2</div>
                     <div>
                         <h3 className="font-semibold text-gray-800 dark:text-gray-200">Step 2: Notify {assignee.Name} Directly</h3>
                         <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click the button below to open a pre-filled WhatsApp chat with {assignee.Name}.
                         </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full group relative flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Open WhatsApp Chat with {assignee.Name}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
