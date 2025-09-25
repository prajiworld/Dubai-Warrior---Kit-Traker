import React, { useState } from 'react';
import type { TeamMember } from '../types';
import DubaiWarriorLogo from './Logo';
import { XCircleIcon } from './Icons';

export type NewUserData = Pick<TeamMember, 'Name' | 'username' | 'password' | 'PhoneNumber'>;

interface SignUpModalProps {
  // FIX: Updated to return a Promise to support async sign-up validation.
  onSignUp: (userData: NewUserData) => Promise<boolean>; // Returns true on success, false on failure (e.g., username exists)
  onClose: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onSignUp, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // FIX: Made the function async to await the promise from onSignUp.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        const success = await onSignUp({
            Name: formData.name,
            username: formData.username.trim(),
            password: formData.password,
            PhoneNumber: formData.phoneNumber,
        });

        if (!success) {
            setError("This username is already taken. Please choose another one.");
        }
    };
    
    const inputClasses = "appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";


    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75"
        >
            <div className="relative w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
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
                    <h2 id="signup-title" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Create an Account
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name-signup" className={labelClasses}>Full Name</label>
                        <input id="name-signup" name="name" className={inputClasses} type="text" placeholder="e.g. Ben Kenobi" value={formData.name} onChange={handleChange} required />
                    </div>
                     <div>
                        <label htmlFor="username-signup" className={labelClasses}>Username</label>
                        <input id="username-signup" name="username" className={inputClasses} type="text" placeholder="e.g. ben" value={formData.username} onChange={handleChange} required />
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
                    
                    {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
                    
                    <button
                        type="submit"
                        className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
                    >
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUpModal;