import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { AssignmentReason, KitStatus } from '../types';
import { formatTime } from '../utils/helpers';
import { ExclamationTriangleIcon, WhatsAppIcon } from './Icons';

interface MatchDayControlPanelProps {
    match: KitTrackerEntry;
    arrivals: Arrival[];
    teamMembers: TeamMember[];
    actions: {
        applyLatePenalty: (matchDate: string) => void;
        reassignKit: (matchDate: string, memberId: string) => void;
        confirmHandover: (matchDate: string) => void;
        notifyPlayer: (matchDate: string) => void;
    };
}

const MatchDayControlPanel: React.FC<MatchDayControlPanelProps> = ({ match, arrivals, teamMembers, actions }) => {
    const [isReassigning, setIsReassigning] = useState(false);
    
    const getMemberName = (memberId: string) => teamMembers.find(m => m.MemberID === memberId)?.Name || 'N/A';

    const lateArrivals = arrivals.filter(a => {
        if (!a.ArrivalTime) return false;
        const arrivalTime = new Date(a.ArrivalTime).toTimeString().slice(0, 5);
        return arrivalTime > match.CutoffTime;
    }).sort((a, b) => new Date(b.ArrivalTime!).getTime() - new Date(a.ArrivalTime!).getTime());

    const lastLatecomer = lateArrivals[0];
    const canApplyPenalty = lateArrivals.length > 0 && match.Status === KitStatus.Upcoming;

    const handleReassign = (memberId: string) => {
        actions.reassignKit(match.Date, memberId);
        setIsReassigning(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-blue-200 dark:border-blue-700">
            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Match Day Control: {match.Date}</h3>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Late Arrivals */}
                <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Late Arrivals ({lateArrivals.length})</h4>
                    {lateArrivals.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm">
                            {lateArrivals.map(a => (
                                <li key={a.ArrivalID} className="flex justify-between">
                                    <span>{getMemberName(a.Member)}</span>
                                    <span className="font-bold">{formatTime(a.ArrivalTime)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">None so far.</p>}
                </div>

                {/* Kit Assignment */}
                <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Kit Assignment</h4>
                    <div className="mt-2 text-sm space-y-1">
                        <p><strong>Assigned:</strong> {getMemberName(match.KitResponsible || match.ProvisionalAssignee)}</p>
                        <p><strong>Reason:</strong> <span className="font-semibold">{match.Reason}</span></p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {match.Status === KitStatus.Upcoming && (
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold mb-2">Admin Actions</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <button disabled={!canApplyPenalty} onClick={() => actions.applyLatePenalty(match.Date)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600 disabled:bg-gray-400">
                            <ExclamationTriangleIcon/> Apply Penalty
                        </button>
                         <button onClick={() => setIsReassigning(true)} className="px-3 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">Reassign Kit</button>
                         <button onClick={() => actions.notifyPlayer(match.Date)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600">
                            <WhatsAppIcon /> Notify Player
                        </button>
                         <button onClick={() => actions.confirmHandover(match.Date)} className="px-3 py-2 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-800">Confirm Handover</button>
                    </div>
                 </div>
            )}
             {match.Status === KitStatus.Completed && <p className="mt-6 text-center font-bold text-green-600 dark:text-green-400">Handover Confirmed!</p>}


            {/* Reassign Modal */}
            {isReassigning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsReassigning(false)}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-lg mb-4">Reassign Kit To...</h4>
                        <div className="max-h-64 overflow-y-auto">
                            {teamMembers.filter(m => m.Status === 'Active').map(m => (
                                <button key={m.MemberID} onClick={() => handleReassign(m.MemberID)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">{m.Name}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchDayControlPanel;