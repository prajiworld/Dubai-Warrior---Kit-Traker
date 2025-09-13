import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { KitStatus } from '../types';
import UserPanel from './UserPanel';
import DataManagementPanel from './DataManagementPanel';
import KitRotationSchedulePanel from './KitRotationSchedulePanel';
import MatchDayControlPanel from './MatchDayControlPanel';

type AdminTab = 'dashboard' | 'schedule' | 'match_control' | 'data';

interface AdminPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        // UserPanel actions
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
        checkIn: (matchDate: string) => void;
        notifyNextPlayer: (matchDate: string) => void;
        // DataManagementPanel actions
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
        addBulkTeamMembers: (data: any[]) => { added: number, skipped: number };
        addBulkMatches: (data: any[]) => { added: number, skipped: number };
        // Schedule Panel action
        assignKitDuty: (matchDate: string, memberId: string) => void;
        // MatchDayControlPanel actions
        applyLatePenalty: (matchDate: string) => void;
        reassignKit: (matchDate: string, memberId: string) => void;
        confirmHandover: (matchDate: string) => void;
        notifyPlayer: (matchDate: string) => void;
    };
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const upcomingMatch = props.kitTracker
        .filter(k => k.Status === KitStatus.Upcoming)
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())[0];

    const tabStyles = {
        base: "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent",
        active: "bg-brand-primary text-white",
        inactive: "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600",
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                {(['dashboard', 'schedule', 'match_control', 'data'] as AdminTab[]).map(tab => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${tabStyles.base} ${activeTab === tab ? tabStyles.active : tabStyles.inactive}`}
                    >
                        {tab.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {activeTab === 'dashboard' && <UserPanel {...props} />}
                {activeTab === 'schedule' && (
                    <KitRotationSchedulePanel 
                        teamMembers={props.teamMembers} 
                        kitTracker={props.kitTracker} 
                        isAdmin={true}
                        onAssign={props.actions.assignKitDuty}
                    />
                )}
                {activeTab === 'match_control' && (
                    upcomingMatch ? (
                        <MatchDayControlPanel
                            match={upcomingMatch}
                            arrivals={props.arrivals.filter(a => a.MatchDate === upcomingMatch.Date)}
                            teamMembers={props.teamMembers}
                            actions={props.actions}
                        />
                    ) : (
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                            <h3 className="text-lg font-semibold">No Upcoming Match</h3>
                            <p className="text-gray-500 mt-1">Match Day Control is only available when a match is scheduled.</p>
                        </div>
                    )
                )}
                {activeTab === 'data' && <DataManagementPanel teamMembers={props.teamMembers} kitTracker={props.kitTracker} actions={props.actions} />}
            </div>
        </div>
    );
};

export default AdminPanel;