import React, { useState } from 'react';
import type { TeamMember } from '../types';
import DubaiWarriorLogo from './Logo';
import { XCircleIcon, CheckCircleIcon } from './Icons';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export type NewUserData = Pick<TeamMember, 'Name' | 'username' | 'password' | 'PhoneNumber' | 'email'>;

interface SignUpModalProps {
  onSignUp: (userData: NewUserData) => Promise<boolean>; // Returns true on success, false on failure
  onClose: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onSignUp, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed || trimmed.includes(' ')) return false;
    if (trimmed.endsWith('.')) return false;
    if (!trimmed.includes('@')) return false;
    const [local, domain] = trimmed.split('@');
    if (!local || !domain) return false;
    if (trimmed.includes('..')) return false;
    if (/[_'",]/.test(domain)) return false;
    if (!domain.includes('.')) return false;
    const labels = domain.split('.');
    const labelRe = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
    if (!labels.every(l => labelRe.test(l))) return false;
    const tld = labels[labels.length - 1];
    if (!/^[A-Za-z]{2,}$/.test(tld)) return false;
    if (!/^[^@\s]{1,64}$/.test(local)) return false;
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Add user to local team members via App.tsx callback
      const successResult = await onSignUp({
        Name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        PhoneNumber: formData.phoneNumber.trim(),
      });

      if (successResult) {
        setSuccess(true);
      } else {
        setError('Username is already taken. Account created in Auth but local sync failed.');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during sign up.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onClose();
  }

  const inputClasses = 'appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white';
  const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (success) {
    return (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4 text-center">
            <div className="flex justify-center mx-auto mb-4">
                <DubaiWarriorLogo className="h-20 w-20" />
            </div>
            <div className="bg-status-green/10 p-4 rounded-md flex flex-col items-center gap-y-3">
                <CheckCircleIcon className="h-8 w-8 text-status-green" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Created!</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your account has been successfully created. You can now log in to the dashboard.
                </p>
            </div>
            <button
                onClick={onClose}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary transition-colors"
            >
                Proceed to Login
            </button>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="signup-title" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent">
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex justify-center mx-auto mb-4">
            <DubaiWarriorLogo className="h-20 w-20" />
          </div>
          <h2 id="signup-title" className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create Your Account</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="name-signup" className={labelClasses}>Full Name</label>
            <input id="name-signup" name="name" className={inputClasses} type="text" placeholder="e.g. Ben Kenobi" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="username-signup" className={labelClasses}>Username</label>
            <input id="username-signup" name="username" className={inputClasses} type="text" placeholder="e.g. benkenobi" value={formData.username} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="email-signup" className={labelClasses}>Email</label>
            <input id="email-signup" name="email" className={inputClasses} type="email" placeholder="e.g. ben@example.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="password-signup" className={labelClasses}>Password</label>
            <input id="password-signup" name="password" className={inputClasses} type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="confirm-password-signup" className={labelClasses}>Confirm Password</label>
            <input id="confirm-password-signup" name="confirmPassword" className={inputClasses} type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="phone-signup" className={labelClasses}>Phone Number</label>
            <input id="phone-signup" name="phoneNumber" className={inputClasses} type="tel" placeholder="+971501234567" value={formData.phoneNumber} onChange={handleChange} required />
          </div>

          {error && (
            <div className="bg-status-red/10 p-3 rounded-md flex items-center gap-x-2">
                <XCircleIcon className="h-5 w-5 text-status-red" />
                <p className="text-sm text-status-red font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
         <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="#" onClick={handleCloseClick} className="font-medium text-brand-accent hover:text-brand-secondary">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default SignUpModal;
