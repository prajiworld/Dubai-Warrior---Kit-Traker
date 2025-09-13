import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { KitStatus, MemberStatus } from '../types';

interface KitRotationSchedulePanelProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    isAdmin: boolean;
    onAssign?: (memberId: string, matchDate: string) => void;
}

const KitRotationSchedulePanel: React.FC<KitRotationSchedulePanelProps> = ({ teamMembers, kitTracker, isAdmin, onAssign }) => {
    const [showAll, setShowAll] = useState(false);

    const upcomingMatches = kitTracker
        .filter(k => k.Status === KitStatus.Upcoming)
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    const eligibleMembers = teamMembers.filter(m => m.OwnsCar === true && m.Status === MemberStatus.Active);

    const getMemberName = (memberId: string): string => {
        return teamMembers.find(m => m.MemberID === memberId)?.Name || 'Unassigned';
    };

    const handleAssignmentChange = (memberId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onAssign) {
            onAssign(memberId, e.target.value);
        }
    };
    
    const displayedMatches = showAll ? upcomingMatches : upcomingMatches.slice(0, 3);
    const displayedMembers = showAll ? eligibleMembers.sort((a,b) => a.Order - b.Order) : eligibleMembers.sort((a,b) => a.Order - b.Order).slice(0, 3);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold">Upcoming Kit Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isAdmin ? 'Assign a match date to each eligible player.' : 'View the schedule for upcoming matches.'}
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-3">{isAdmin ? 'Eligible Player' : 'Match Date'}</th>
                            <th className="px-4 py-3">{isAdmin ? 'Assigned Match Date' : 'Assigned Player'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdmin ? (
                            // ADMIN VIEW: Player-centric
                            displayedMembers.length > 0 ? (
                                displayedMembers.map(member => {
                                    const assignedMatch = upcomingMatches.find(m => m.ProvisionalAssignee === member.MemberID);
                                    return (
                                        <tr key={member.MemberID} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium">{member.Name}</td>
                                            <td className="px-4 py-3">
                                                {onAssign ? (
                                                    <select
                                                        value={assignedMatch?.Date || ''}
                                                        onChange={(e) => handleAssignmentChange(member.MemberID, e)}
                                                        className="block w-full text-sm px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                                                    >
                                                        <option value="">-- Not Scheduled --</option>
                                                        {upcomingMatches.map(match => {
                                                            const currentAssignee = match.ProvisionalAssignee ? teamMembers.find(tm => tm.MemberID === match.ProvisionalAssignee) : null;
                                                            const isAssignedToSomeoneElse = currentAssignee && currentAssignee.MemberID !== member.MemberID;
                                                            return (
                                                                <option key={match.Date} value={match.Date} disabled={isAssignedToSomeoneElse}>
                                                                    {match.Date} {isAssignedToSomeoneElse ? `(Assigned to ${currentAssignee.Name})` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={2} className="px-4 py-3 text-center text-gray-500">No eligible members to schedule.</td></tr>
                            )
                        ) : (
                            // PLAYER VIEW: Match-centric
                            displayedMatches.length > 0 ? (
                                displayedMatches.map(match => (
                                    <tr key={match.Date} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-3 font-medium">{match.Date}</td>
                                        <td className="px-4 py-3">
                                            <span>{getMemberName(match.ProvisionalAssignee)}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={2} className="px-4 py-3 text-center text-gray-500">No upcoming matches scheduled.</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {(isAdmin ? eligibleMembers.length > 3 : upcomingMatches.length > 3) && (
                 <div className="mt-4 text-center">
                    <button
                        onClick={() => setShowAll(prev => !prev)}
                        className="text-sm font-semibold text-brand-accent hover:text-brand-secondary focus:outline-none"
                    >
                        {showAll ? 'View Less' : 'View More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default KitRotationSchedulePanel;