import React, { useState } from 'react';
import DubaiWarriorLogo from './Logo';
import { XCircleIcon, CheckCircleIcon } from './Icons';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Still show success to prevent email enumeration, or show a generic message
        setSubmitted(true);
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('An error occurred. Please try again later.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onClose();
  }

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
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
          aria-label="Close"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
            <div className="flex justify-center mx-auto mb-4">
                <DubaiWarriorLogo className="h-20 w-20" />
            </div>
            <h2 id="forgot-password-title" className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Reset Your Password
            </h2>
        </div>

        {submitted ? (
            <div className="text-center space-y-6">
                 <div className="bg-status-green/10 p-4 rounded-md flex flex-col items-center gap-y-3">
                    <CheckCircleIcon className="h-8 w-8 text-status-green" />
                    <p className="text-sm text-status-green font-medium">
                        If an account with that email exists, password reset instructions have been sent to the associated email address.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
                >
                    Return to Sign In
                </button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Enter your email address and we will send password reset instructions to your registered email.
                </p>
                <div>
                    <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                        id="email-forgot"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="e.g. alex@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                
                {error && (
                    <p className="text-sm text-red-500 text-center font-medium">{error}</p>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Reset Instructions'}
                    </button>
                </div>
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Remember your password?{' '}
                    <a href="#" onClick={handleCloseClick} className="font-medium text-brand-accent hover:text-brand-secondary">
                        Sign In
                    </a>
                </p>
            </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
