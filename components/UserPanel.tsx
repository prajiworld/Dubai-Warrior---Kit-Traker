import React from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import KitSchedulePanel from './KitSchedulePanel';
import KitRotationSchedulePanel from './KitRotationSchedulePanel';

interface UserPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
        takeOnBehalf: (matchDate: string, memberId: string) => void;
        checkIn: (matchDate: string) => void;
    };
}

const UserPanel: React.FC<UserPanelProps> = ({ currentUser, teamMembers, kitTracker, arrivals, actions }) => {
    const myArrivals = arrivals
        .filter(a => a.Member === currentUser.MemberID)
        .sort((a, b) => new Date(b.MatchDate).getTime() - new Date(a.MatchDate).getTime());
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <KitSchedulePanel 
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    kitTracker={kitTracker}
                    arrivals={arrivals}
                    actions={actions}
                />
                <KitRotationSchedulePanel 
                    teamMembers={teamMembers}
                    readOnly={true}
                />
            </div>
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">My Arrival History</h3>
                    {myArrivals.length > 0 ? (
                        <ul className="space-y-3 max-h-96 overflow-y-auto">
                            {myArrivals.map(arrival => (
                                <li key={arrival.ArrivalID} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                    <div>
                                        <p className="font-semibold text-sm">{formatDate(arrival.MatchDate)}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${arrival.ArrivalTime ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {arrival.ArrivalTime ? formatTime(arrival.ArrivalTime) : 'Missed'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No arrival history yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPanel;