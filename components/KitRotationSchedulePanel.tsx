import React from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { KitStatus, MemberStatus } from '../types';

interface KitRotationSchedulePanelProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    isAdmin: boolean;
    onAssign?: (matchDate: string, memberId: string) => void;
}

const KitRotationSchedulePanel: React.FC<KitRotationSchedulePanelProps> = ({ teamMembers, kitTracker, isAdmin, onAssign }) => {
    const upcomingMatches = kitTracker
        .filter(k => k.Status === KitStatus.Upcoming)
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    const eligibleMembers = teamMembers.filter(m => m.Status === MemberStatus.Active && m.RotationEligible === 'Yes');

    const getMemberName = (memberId: string): string => {
        return teamMembers.find(m => m.MemberID === memberId)?.Name || 'Unassigned';
    };

    const handleAssignmentChange = (matchDate: string, e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onAssign) {
            onAssign(matchDate, e.target.value);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold">Upcoming Kit Schedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isAdmin ? 'Assign players to upcoming matches.' : 'View the schedule for upcoming matches.'}
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
                        {upcomingMatches.length > 0 ? (
                            upcomingMatches.map(match => (
                                <tr key={match.Date} className="border-b dark:border-gray-700">
                                    <td className="px-4 py-3 font-medium">{match.Date}</td>
                                    <td className="px-4 py-3">
                                        {isAdmin && onAssign ? (
                                            <select
                                                value={match.ProvisionalAssignee || ''}
                                                onChange={(e) => handleAssignmentChange(match.Date, e)}
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
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-center text-gray-500">No upcoming matches to schedule.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default KitRotationSchedulePanel;
