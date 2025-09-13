import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { KitStatus, MemberStatus } from '../types';
import { formatDate, formatTime } from '../utils/helpers';
import StatusBadge from './StatusBadge';
import PlayerSelectionModal from './PlayerSelectionModal';

interface KitSchedulePanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    actions: {
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string, newAssigneeId: string) => void;
        checkIn: (matchDate: string) => void;
    };
}

const KitSchedulePanel: React.FC<KitSchedulePanelProps> = ({ currentUser, teamMembers, kitTracker, arrivals, actions }) => {
    const [showReassignModal, setShowReassignModal] = useState(false);

    const upcomingMatch = kitTracker
        .filter(k => [KitStatus.Upcoming, KitStatus.Scheduled].includes(k.Status))
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())[0];

    const getMemberName = (memberId: string) => teamMembers.find(m => m.MemberID === memberId)?.Name || 'N/A';

    const renderUserActions = (match: KitTrackerEntry) => {
        if (!match || match.Status !== KitStatus.Upcoming) return null;

        const isCurrentUserProvisional = match.ProvisionalAssignee === currentUser.MemberID;
        const isKitResponsibleSet = !!match.KitResponsible;

        const eligibleForReassignment = teamMembers.filter(m =>
            m.MemberID !== currentUser.MemberID &&
            m.Status === MemberStatus.Active &&
            m.OwnsCar === true
        );
    
        const handleDeclineClick = () => {
            if (eligibleForReassignment.length === 0) {
                alert("There are no other eligible players to reassign kit duty to. Please contact an admin to arrange a swap.");
                return;
            }
            setShowReassignModal(true);
        };

        if (isCurrentUserProvisional && !isKitResponsibleSet) {
            return (
                 <>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button onClick={() => actions.confirmKitDuty(match.Date)} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Confirm Kit Duty</button>
                        <button onClick={handleDeclineClick} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Decline Kit Duty</button>
                    </div>
                     {showReassignModal && (
                        <PlayerSelectionModal
                            title="Reassign Duty To"
                            teamMembers={eligibleForReassignment}
                            onClose={() => setShowReassignModal(false)}
                            onSelect={(newAssigneeId) => {
                                actions.declineKitDuty(match.Date, newAssigneeId);
                                setShowReassignModal(false);
                            }}
                        />
                    )}
                </>
            );
        }

        return null;
    };

    const renderCheckIn = (match: KitTrackerEntry) => {
        // Check-in is only available for confirmed, upcoming matches.
        if (!match || match.Status !== KitStatus.Upcoming || !match.MatchOn) return null;
        
        const myArrival = arrivals.find(a => a.MatchDate === match.Date && a.Member === currentUser.MemberID);
        if (myArrival?.ArrivalTime) {
             return <p className="mt-4 text-center text-sm font-semibold text-green-600 dark:text-green-400">Checked in at {formatTime(myArrival.ArrivalTime)}</p>;
        }

        const now = new Date();
        const matchDateTime = new Date(`${match.Date}T${match.CutoffTime}`);
        const isCheckInActive = now < matchDateTime;

        if (!isCheckInActive) {
            return <p className="mt-4 text-center text-sm text-gray-500">Check-in has closed.</p>;
        }

        return (
             <div className="mt-6">
                <button 
                    onClick={() => actions.checkIn(match.Date)}
                    className="w-full px-4 py-3 text-base font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    Check-In for Today's Match
                </button>
            </div>
        );
    }


    if (!upcomingMatch) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                <h3 className="text-xl font-bold">No Upcoming Matches</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">The schedule is clear. Check back later for new match dates.</p>
            </div>
        );
    }
    
    const { Date: date, ProvisionalAssignee, KitResponsible, CutoffTime, Notes, Status } = upcomingMatch;
    const responsibleName = getMemberName(KitResponsible);
    const provisionalName = getMemberName(ProvisionalAssignee);
    const isDecided = !!KitResponsible;

    const today = new Date().toISOString().split('T')[0];
    let displayStatus: KitStatus | 'Match Day' = Status;
    if (Status === KitStatus.Upcoming && date === today) {
        displayStatus = 'Match Day';
    }


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">Next Match</h3>
                    <p className="text-lg font-semibold text-brand-primary">{formatDate(date)}</p>
                </div>
                <StatusBadge status={displayStatus} />
            </div>
            
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex justify-between">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Kit Duty:</span>
                    <span className={`font-bold ${isDecided ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {isDecided ? responsibleName : `${provisionalName || 'Not Assigned'} ${Status === KitStatus.Scheduled ? '(Scheduled)' : '(Pending)'}`}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Arrival Cutoff:</span>
                    <span className="font-semibold">{formatTime(`${date}T${CutoffTime}`)}</span>
                </div>
                 {Notes && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                        <p className="font-semibold">Match Notes:</p>
                        <p>{Notes}</p>
                    </div>
                )}
            </div>

            {renderUserActions(upcomingMatch)}
            {renderCheckIn(upcomingMatch)}
        </div>
    );
};

export default KitSchedulePanel;