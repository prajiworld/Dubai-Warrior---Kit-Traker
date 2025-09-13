import React from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import KitSchedulePanel from './KitSchedulePanel';
import KitHistoryPanel from './KitHistoryPanel';
import KitRotationSchedulePanel from './KitRotationSchedulePanel';

interface UserPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
        checkIn: (matchDate: string) => void;
        notifyNextPlayer: (matchDate: string) => void;
    };
}

const UserPanel: React.FC<UserPanelProps> = ({ currentUser, teamMembers, kitTracker, arrivals, actions }) => {
    return (
        <div className="space-y-6">
            <KitSchedulePanel 
                currentUser={currentUser}
                teamMembers={teamMembers}
                kitTracker={kitTracker}
                arrivals={arrivals}
                actions={actions}
            />
            <KitRotationSchedulePanel
                teamMembers={teamMembers}
                kitTracker={kitTracker}
                isAdmin={false}
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