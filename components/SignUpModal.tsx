import React, { useState } from 'react';
import type { TeamMember } from '../types';
import DubaiWarriorLogo from './Logo';
import { XCircleIcon } from './Icons';

export type NewUserData = Pick<TeamMember, 'Name' | 'username' | 'password' | 'PhoneNumber'>;

interface SignUpModalProps {
  onSignUp: (userData: NewUserData) => boolean; // Returns true on success, false on failure (e.g., username exists)
  onClose: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onSignUp, onClose }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        const success = onSignUp({
            Name: name,
            username: username.trim(),
            password,
            PhoneNumber: phoneNumber,
        });

        if (!success) {
            setError("This username is already taken. Please choose another one.");
        }
    };
    
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
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
                    <h2 id="signup-title" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Create an Account
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-white" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <input className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-white" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                    <input className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-white" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <input className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-white" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    <input className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 text-white" type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                    
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
