import React from 'react';
import type { TeamMember, KitTrackerEntry, Penalty } from '../types';
import MatchSchedulePanel from './MatchSchedulePanel';
import KitHistoryPanel from './KitHistoryPanel';

interface UserPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    penalizedPlayers: Penalty[];
    actions: {
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
        notifyNextPlayer: (matchDate: string) => void;
    };
}

const UserPanel: React.FC<UserPanelProps> = ({ currentUser, teamMembers, kitTracker, penalizedPlayers, actions }) => {
    return (
        <div className="space-y-6">
            <MatchSchedulePanel 
                currentUser={currentUser}
                teamMembers={teamMembers}
                kitTracker={kitTracker}
                actions={{
                    confirmKitDuty: actions.confirmKitDuty,
                    declineKitDuty: actions.declineKitDuty,
                }}
            />
            <KitHistoryPanel 
                teamMembers={teamMembers}
                kitTracker={kitTracker}
                actions={actions}
            />
        </div>
    );
};

export default UserPanel;