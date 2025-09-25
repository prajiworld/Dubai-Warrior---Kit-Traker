import React from 'react';
import DubaiWarriorLogo from './Logo';
import { XCircleIcon } from './Icons';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75"
    >
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
            <div className="flex justify-center mx-auto mb-4">
                <DubaiWarriorLogo className="h-20 w-20" />
            </div>
            <h2 id="forgot-password-title" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Forgot Password
            </h2>
        </div>

        <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">
                To reset your password, please contact a team administrator. They will be able to reset it for you securely.
            </p>
            <button
                onClick={onClose}
                className="mt-6 w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;