import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import KitHistoryPanel from './KitHistoryPanel';
import DataManagementPanel from './DataManagementPanel';
import MatchDayControlPanel from './MatchDayControlPanel';
import KitRotationSchedulePanel from './KitRotationSchedulePanel';
import { KitStatus } from '../types';

interface AdminPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        notifyNextPlayer: (matchDate: string) => void;
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
        addBulkTeamMembers: (data: any[]) => { added: number, skipped: number };
        addBulkMatches: (data: any[]) => { added: number, skipped: number };
        applyLatePenalty: (matchDate: string) => void;
        reassignKit: (matchDate: string, memberId: string) => void;
        confirmHandover: (matchDate: string) => void;
        moveMemberUpInRotation: (memberId: string) => void; // New
        moveMemberDownInRotation: (memberId: string) => void; // New
    };
}

type AdminTab = 'Dashboard' | 'Schedule' | 'History' | 'Data';

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, teamMembers, kitTracker, arrivals, actions }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                const sortedMatches = [...kitTracker].sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
                const today = new Date().toISOString().split('T')[0];
                const activeMatch = sortedMatches.find(m => m.Date === today && m.Status === KitStatus.Upcoming) || sortedMatches.find(m => m.Status === KitStatus.Upcoming) || sortedMatches[0];

                return (
                     <div className="space-y-6">
                       {activeMatch ? (
                           <MatchDayControlPanel
                                match={activeMatch}
                                arrivals={arrivals.filter(a => a.MatchDate === activeMatch.Date)}
                                teamMembers={teamMembers}
                                actions={{
                                    applyLatePenalty: actions.applyLatePenalty,
                                    reassignKit: actions.reassignKit,
                                    confirmHandover: actions.confirmHandover,
                                    notifyPlayer: actions.notifyNextPlayer,
                                }}
                           />
                       ) : <p>No active match found.</p>}
                    </div>
                );
            case 'Schedule':
                return <KitRotationSchedulePanel 
                            teamMembers={teamMembers} 
                            readOnly={false} 
                            actions={{
                                moveMemberUp: actions.moveMemberUpInRotation,
                                moveMemberDown: actions.moveMemberDownInRotation,
                            }}
                        />;
            case 'History':
                return <KitHistoryPanel teamMembers={teamMembers} kitTracker={kitTracker} actions={{notifyNextPlayer: actions.notifyNextPlayer}} />;
            case 'Data':
                const dataActions = { ...actions }; 
                return <DataManagementPanel teamMembers={teamMembers} kitTracker={kitTracker} actions={dataActions} />;
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
                <button onClick={() => setActiveTab('Schedule')} className={tabClass('Schedule')}>Schedule</button>
                <button onClick={() => setActiveTab('History')} className={tabClass('History')}>History</button>
                <button onClick={() => setActiveTab('Data')} className={tabClass('Data')}>Data Management</button>
            </div>
            <div>{renderTabContent()}</div>
        </div>
    );
};

export default AdminPanel;