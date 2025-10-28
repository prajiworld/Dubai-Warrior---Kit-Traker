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

    const displayedMatches = showAll ? upcomingMatches : upcomingMatches.slice(0, 3);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold">Upcoming Kit Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isAdmin ? 'Assign a player to each match date.' : 'View the schedule for upcoming matches.'}
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-3">Match Date</th>
                            <th className="px-4 py-3">Assigned Player</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdmin ? (
                            // ADMIN VIEW: Match-centric
                            displayedMatches.length > 0 ? (
                                displayedMatches.map(match => (
                                    <tr key={match.Date} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-3 font-medium">{match.Date}</td>
                                        <td className="px-4 py-3">
                                            {onAssign ? (
                                                <select
                                                    value={match.ProvisionalAssignee || ''}
                                                    onChange={(e) => onAssign(e.target.value, match.Date)}
                                                    className="block w-full text-sm px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                                                >
                                                    <option value="">-- Unassigned --</option>
                                                    {eligibleMembers.map(member => (
                                                        <option key={member.MemberID} value={member.MemberID}>
                                                            {member.Name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span>{getMemberName(match.ProvisionalAssignee)}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={2} className="px-4 py-3 text-center text-gray-500">No upcoming matches to schedule.</td></tr>
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

            {upcomingMatches.length > 3 && (
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
