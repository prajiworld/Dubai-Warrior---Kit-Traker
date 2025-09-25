import React, { useState } from 'react';
import DubaiWarriorLogo from './Logo';

interface LoginPageProps {
    onLogin: (username: string, password: string) => Promise<boolean>;
    onShowSignUp: () => void;
    onShowForgotPassword: () => void;
    onShowPublicView: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowSignUp, onShowForgotPassword, onShowPublicView }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupMessage, setSetupMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = await onLogin(username, password);
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
    
    const handlePublicViewClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onShowPublicView();
    }

    const handleSetupDatabase = async () => {
        setIsSettingUp(true);
        setSetupMessage(null);
        try {
            const response = await fetch('/api/setup');
            const data = await response.json();
            if (response.ok) {
                setSetupMessage({ type: 'success', text: `Database setup successful: ${data.message}. Please refresh and log in.` });
            } else {
                throw new Error(data.message || 'Setup failed. The database might already be initialized.');
            }
        } catch (error) {
            setSetupMessage({ type: 'error', text: `Database setup failed: ${error.message}` });
        } finally {
            setIsSettingUp(false);
        }
    };

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
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center font-medium">{error}</p>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <a href="#" onClick={handleForgotPasswordClick} className="font-medium text-brand-accent hover:text-brand-primary">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <a href="#" onClick={handleSignUpClick} className="font-medium text-brand-accent hover:text-brand-primary">
                            Sign up
                        </a>
                    </p>
                     <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Or view the{' '}
                        <a href="#" onClick={handlePublicViewClick} className="font-medium text-brand-accent hover:text-brand-primary">
                            Public Schedule
                        </a>
                    </p>
                </div>
                
                {/* First Time Setup Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">First-Time Setup</h3>
                    <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">If this is the first deployment, click here to initialize the database tables and data.</p>
                    <button
                        onClick={handleSetupDatabase}
                        disabled={isSettingUp}
                        className="mt-3 w-full group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                        {isSettingUp ? 'Initializing...' : 'Initialize Database'}
                    </button>
                    {setupMessage && <p className={`mt-2 text-center text-xs font-medium ${setupMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{setupMessage.text}</p>}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;