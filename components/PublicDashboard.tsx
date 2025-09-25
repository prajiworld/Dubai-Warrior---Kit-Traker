import React from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import KitRotationSchedulePanel from './KitRotationSchedulePanel';
import KitHistoryPanel from './KitHistoryPanel';
import DubaiWarriorLogo from './Logo';

interface PublicDashboardProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    onNavigateToLogin: () => void;
}

const PublicDashboard: React.FC<PublicDashboardProps> = ({ teamMembers, kitTracker, onNavigateToLogin }) => {
    // A dummy action object for the history panel, as it requires one but actions are disabled for public view.
    const dummyActions = {
        notifyNextPlayer: () => {},
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-900 shadow-md">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <DubaiWarriorLogo className="h-10 w-10" />
                        <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
                            Public Match Schedule
                        </h1>
                    </div>
                    <button
                        onClick={onNavigateToLogin}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                    >
                        Admin & Player Login
                    </button>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        <KitRotationSchedulePanel
                            teamMembers={teamMembers}
                            kitTracker={kitTracker}
                            isAdmin={false} // Always show player view
                        />
                        <KitHistoryPanel
                            teamMembers={teamMembers}
                            kitTracker={kitTracker}
                            actions={dummyActions} // Pass dummy actions
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicDashboard;
