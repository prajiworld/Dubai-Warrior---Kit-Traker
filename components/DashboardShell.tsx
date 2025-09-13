import React from 'react';
import type { TeamMember } from '../types';
import { UserCircleIcon } from './Icons';
import DubaiWarriorLogo from './Logo';

interface DashboardShellProps {
    currentUser: TeamMember;
    onLogout: () => void;
    onNavigateToProfile: () => void;
    children: React.ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ currentUser, onLogout, onNavigateToProfile, children }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-900 shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <DubaiWarriorLogo className="h-10 w-10" />
                        <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
                            Kit & Arrival Tracker
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                           <p className="font-semibold">{currentUser.Name}</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.IsAdmin ? 'Admin' : 'Player'}</p>
                        </div>
                        <button
                            onClick={onNavigateToProfile}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                            aria-label="My Profile"
                        >
                            <UserCircleIcon className="h-6 w-6"/>
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardShell;