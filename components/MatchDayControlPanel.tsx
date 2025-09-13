

import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { KitStatus, MemberStatus, AssignmentReason } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import StatusBadge from './StatusBadge';
import { WhatsAppIcon, ExclamationTriangleIcon, XCircleIcon } from './Icons';

interface MatchDayControlPanelProps {
    match: KitTrackerEntry;
    teamMembers: TeamMember[];
    arrivals: Arrival[];
    actions: {
        confirmMatchStatus: (matchDate: string, newStatus: KitStatus.Upcoming | KitStatus.NoPlay) => void;
        applyLatePenalty: (matchDate: string, memberId: string) => void;
        reassignKit: (matchDate: string, newMemberId: string) => void;
        confirmHandover: (matchDate: string) => void;
        notifyPlayer: (matchDate: string) => void;
    };
}

const ReassignModal: React.FC<{
    title: string;
    teamMembers: TeamMember[];
    onSelect: (memberId: string) => void;
    onClose: () => void;
}> = ({ title, teamMembers, onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4" onClick={onClose}>
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-lg">{title}</h4>
                        <button type="button" onClick={onClose}><XCircleIcon /></button>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {teamMembers.map(member => (
                            <li key={member.MemberID}>
                                <button
                                    onClick={() => onSelect(member.MemberID)}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {member.Name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const MatchDayControlPanel: React.FC<MatchDayControlPanelProps> = ({ match, teamMembers, arrivals, actions }) => {
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];
    const isMatchDay = match.Date === today;
    let displayStatus: KitStatus | 'Match Day' = match.Status;
    if (match.Status === KitStatus.Upcoming && isMatchDay) {
        displayStatus = 'Match Day';
    }

    const matchArrivals = arrivals.filter(a => a.MatchDate === match.Date && a.ArrivalTime);
    const cutoffDateTime = new Date(`${match.Date}T${match.CutoffTime}`).getTime();
    const lateArrivals = matchArrivals.filter(a => new Date(a.ArrivalTime!).getTime() > cutoffDateTime);
    
    const assignedMemberId = match.KitResponsible || match.ProvisionalAssignee;
    const assignedMember = teamMembers.find(m => m.MemberID === assignedMemberId);

    if (match.Status === KitStatus.Completed || match.Status === KitStatus.Missed || match.Status === KitStatus.NoPlay) {
        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <h3 className="text-xl font-bold">Match for {formatDate(match.Date)} is finalized.</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Its status is <StatusBadge status={match.Status} />.</p>
            </div>
        );
    }
    
    // Confirmation View for "Scheduled" matches
    if (match.Status === KitStatus.Scheduled) {
         return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <div>
                    <h3 className="text-xl font-bold">Confirm Match Status</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confirm if the match on {formatDate(match.Date)} is happening.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button onClick={() => actions.confirmMatchStatus(match.Date, KitStatus.Upcoming)} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                       ✔ Confirm Match is ON
                    </button>
                    <button onClick={() => actions.confirmMatchStatus(match.Date, KitStatus.NoPlay)} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                        ✖ Mark as No Play
                    </button>
                </div>
            </div>
        );
    }

    // Main Control View for "Upcoming" matches
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold">Match Day Control: {formatDate(match.Date)}</h3>
                    <StatusBadge status={displayStatus} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Finalize match details and player duties.</p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-semibold">Current Assignment</h4>
                <div className="mt-2 flex justify-between items-center">
                    <p className="text-lg font-bold text-brand-primary">{assignedMember?.Name || 'Unassigned'}</p>
                    <div className="flex items-center gap-2">
                        {lateArrivals.length > 0 && <span className="text-xs font-semibold text-red-500 flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4" /> {lateArrivals.length} Late</span>}
                        <span className="text-xs font-semibold text-gray-500">{match.Reason}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-semibold mb-3">Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setShowPenaltyModal(true)}
                        className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-200"
                    >
                        <ExclamationTriangleIcon className="w-6 h-6 mb-1"/>
                        <span className="text-sm font-semibold text-center">Apply Late Penalty</span>
                    </button>
                     <button
                        onClick={() => setShowReassignModal(true)}
                        className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200"
                    >
                        🔄
                        <span className="text-sm font-semibold text-center mt-1">Reassign Kit</span>
                    </button>
                    <button
                        onClick={() => actions.notifyPlayer(match.Date)}
                        disabled={!assignedMember}
                        className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 text-green-700 dark:text-green-200"
                    >
                        <WhatsAppIcon className="w-6 h-6 mb-1" />
                         <span className="text-sm font-semibold text-center">Notify Player</span>
                    </button>
                     <button
                        onClick={() => actions.confirmHandover(match.Date)}
                        disabled={!assignedMember}
                        className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 text-blue-700 dark:text-blue-200"
                    >
                        ✔
                        <span className="text-sm font-semibold text-center mt-1">Confirm Handover</span>
                    </button>
                </div>
            </div>
            
            {showReassignModal && (
                <ReassignModal
                    title="Reassign Kit To"
                    teamMembers={teamMembers.filter(m => m.Status === MemberStatus.Active && m.MemberID !== assignedMemberId)}
                    onClose={() => setShowReassignModal(false)}
                    onSelect={(memberId) => {
                        actions.reassignKit(match.Date, memberId);
                        setShowReassignModal(false);
                    }}
                />
            )}

            {showPenaltyModal && (
                <ReassignModal
                    title="Apply Penalty To"
                    teamMembers={teamMembers.filter(m => m.Status === MemberStatus.Active)}
                    onClose={() => setShowPenaltyModal(false)}
                    onSelect={(memberId) => {
                        actions.applyLatePenalty(match.Date, memberId);
                        setShowPenaltyModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default MatchDayControlPanel;