import React, { useState } from 'react';
import DubaiWarriorLogo from './Logo';

interface LoginPageProps {
    onLogin: (username: string, password: string) => boolean;
    onShowSignUp: () => void;
    onShowForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowSignUp, onShowForgotPassword }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = onLogin(username, password);
        if (!success) {
            setError('Invalid username or password. Please try again.');
        }
    };
    
    const handleForgotPasswordClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onShowForgotPassword();
    }
    const handleSignUpClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onShowSignUp();
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    <div className="flex justify-center mx-auto">
                      <DubaiWarriorLogo className="h-28 w-28" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Welcome Back
                    </h2>
                     <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to continue to the dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                            <input
                                id="username"
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
                             <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center font-medium">{error}</p>
                    )}

                    <div className="flex items-center justify-end text-sm">
                        <a href="#" onClick={handleForgotPasswordClick} className="font-medium text-brand-accent hover:text-brand-secondary">
                            Forgot your password?
                        </a>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
                        >
                            Sign In
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <a href="#" onClick={handleSignUpClick} className="font-medium text-brand-accent hover:text-brand-secondary">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;