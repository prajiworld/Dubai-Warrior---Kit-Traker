

import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { KitStatus } from '../types';
import DataManagementPanel from './DataManagementPanel';
import MatchDayControlPanel from './MatchDayControlPanel';
import KitRotationSchedulePanel from './KitRotationSchedulePanel';
import KitHistoryPanel from './KitHistoryPanel';


interface AdminPanelProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
        // FIX: Updated return type to Promise to match async function
        addBulkTeamMembers: (data: any[]) => Promise<{ added: number, skipped: number }>;
        // FIX: Updated return type to Promise to match async function
        addBulkMatches: (data: any[]) => Promise<{ added: number, skipped: number }>;
        assignPlayerToMatch: (memberId: string, matchDate: string) => void;
        confirmMatchStatus: (matchDate: string, newStatus: KitStatus.Upcoming | KitStatus.NoPlay) => void;
        applyLatePenalty: (matchDate: string, memberId: string) => void;
        reassignKit: (matchDate: string, newMemberId: string) => void;
        confirmHandover: (matchDate: string) => void;
        notifyNextPlayer: (matchDate: string) => void;
    };
}

type AdminTab = 'dashboard'| 'schedule' | 'history' | 'dataManagement';

const AdminPanel: React.FC<AdminPanelProps> = ({ teamMembers, kitTracker, arrivals, actions }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedMatches = [...kitTracker].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    // Find the very next match that is 'Scheduled' or 'Upcoming'
    const nextMatchForControl = sortedMatches.find(k => {
        const matchDate = new Date(k.Date);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate >= today && [KitStatus.Scheduled, KitStatus.Upcoming].includes(k.Status);
    });
    
    // If no future matches, find the most recent past match to show its final state
    const mostRecentPastMatch = sortedMatches.filter(k => {
         const matchDate = new Date(k.Date);
         matchDate.setHours(0,0,0,0);
         return matchDate < today;
    }).pop();
    
    const matchForControlPanel = nextMatchForControl || mostRecentPastMatch;

    const TabButton: React.FC<{ tabName: AdminTab, label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`${
                activeTab === tabName
                    ? 'border-brand-accent text-brand-primary dark:text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === tabName ? 'page' : undefined}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <TabButton tabName="dashboard" label="Dashboard" />
                    <TabButton tabName="schedule" label="Schedule" />
                    <TabButton tabName="history" label="History" />
                    <TabButton tabName="dataManagement" label="Master Data" />
                </nav>
            </div>

            <div>
                 {activeTab === 'dashboard' && (
                    matchForControlPanel ? (
                        <MatchDayControlPanel
                            match={matchForControlPanel}
                            teamMembers={teamMembers}
                            arrivals={arrivals.filter(a => a.MatchDate === matchForControlPanel.Date)}
                            actions={{
                                confirmMatchStatus: actions.confirmMatchStatus,
                                applyLatePenalty: actions.applyLatePenalty,
                                reassignKit: actions.reassignKit,
                                confirmHandover: actions.confirmHandover,
                                notifyPlayer: actions.notifyNextPlayer,
                            }}
                        />
                    ) : (
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                            <h3 className="text-xl font-bold">No Matches Found</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">There are no upcoming or past matches to display. Add one from the Master Data tab.</p>
                        </div>
                    )
                )}
                {activeTab === 'schedule' && (
                    <KitRotationSchedulePanel
                        teamMembers={teamMembers}
                        kitTracker={kitTracker}
                        isAdmin={true}
                        onAssign={actions.assignPlayerToMatch}
                    />
                )}
                {activeTab === 'history' && (
                    <KitHistoryPanel
                        teamMembers={teamMembers}
                        kitTracker={kitTracker}
                        actions={{ notifyNextPlayer: actions.notifyNextPlayer }}
                    />
                )}
                {activeTab === 'dataManagement' && (
                    <DataManagementPanel
                        teamMembers={teamMembers}
                        kitTracker={kitTracker}
                        actions={actions}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminPanel;