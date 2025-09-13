import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import KitSchedulePanel from './KitSchedulePanel';
import KitHistoryPanel from './KitHistoryPanel';
import DataManagementPanel from './DataManagementPanel';
import { formatTime } from '../utils/helpers';

interface AdminPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
        takeOnBehalf: (matchDate: string, memberId: string) => void;
        checkIn: (matchDate: string) => void;
        notifyNextPlayer: () => void;
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
        addBulkTeamMembers: (data: any[]) => { added: number, skipped: number };
        addBulkMatches: (data: any[]) => { added: number, skipped: number };
    };
}

type AdminTab = 'Dashboard' | 'History' | 'Data';

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, teamMembers, kitTracker, arrivals, actions }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');

    const getMemberName = (memberId: string) => teamMembers.find(m => m.MemberID === memberId)?.Name || 'N/A';

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                const today = new Date().toISOString().split('T')[0];
                const todayMatch = kitTracker.find(k => k.Date === today);
                const todaysArrivals = todayMatch ? arrivals.filter(a => a.MatchDate === todayMatch.Date) : [];

                return (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <KitSchedulePanel 
                                currentUser={currentUser}
                                teamMembers={teamMembers}
                                kitTracker={kitTracker}
                                arrivals={arrivals}
                                actions={actions}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <h3 className="text-xl font-bold mb-4">Today's Arrivals ({todaysArrivals.length})</h3>
                                {todayMatch ? (
                                    todaysArrivals.length > 0 ? (
                                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                                        {todaysArrivals
                                            .sort((a,b) => a.ArrivalTime && b.ArrivalTime ? new Date(a.ArrivalTime).getTime() - new Date(b.ArrivalTime).getTime() : a.ArrivalTime ? -1 : 1)
                                            .map(arrival => (
                                            <li key={arrival.ArrivalID} className="flex justify-between items-center text-sm">
                                                <span>{getMemberName(arrival.Member)}</span>
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                    {arrival.ArrivalTime ? formatTime(arrival.ArrivalTime) : 'Pending'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No arrivals recorded yet for today's match.</p>
                                )) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No match scheduled for today.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'History':
                return <KitHistoryPanel teamMembers={teamMembers} kitTracker={kitTracker} actions={{notifyNextPlayer: actions.notifyNextPlayer}} />;
            case 'Data':
                return <DataManagementPanel teamMembers={teamMembers} kitTracker={kitTracker} actions={actions} />;
            default:
                return null;
        }
    };

    const tabClass = (tabName: AdminTab) =>
      `px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        activeTab === tabName
          ? 'bg-brand-primary text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <button onClick={() => setActiveTab('Dashboard')} className={tabClass('Dashboard')}>Dashboard</button>
                <button onClick={() => setActiveTab('History')} className={tabClass('History')}>History</button>
                <button onClick={() => setActiveTab('Data')} className={tabClass('Data')}>Data Management</button>
            </div>
            <div>{renderTabContent()}</div>
        </div>
    );
};

export default AdminPanel;
