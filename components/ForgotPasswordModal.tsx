import React, { useState } from 'react';
import type { TeamMember } from '../types';
import DubaiWarriorLogo from './Logo';
import { XCircleIcon } from './Icons';

interface ForgotPasswordModalProps {
  onClose: () => void;
  teamMembers: TeamMember[];
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, teamMembers }) => {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we'd trigger a backend process.
    // Here, we just move to the next step to simulate the flow
    // without confirming if the user exists for security reasons.
    setSubmitted(true);
  };

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

        {submitted ? (
            <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300">
                    If an account with that username exists, password reset instructions have been sent to the associated phone number.
                </p>
                <button
                    onClick={onClose}
                    className="mt-6 w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
                >
                    Close
                </button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Enter your username and we will simulate sending password reset instructions.
                </p>
                <div>
                    <label htmlFor="username-forgot" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                    <input
                        id="username-forgot"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="e.g. alex"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
                    >
                        Reset Password
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
