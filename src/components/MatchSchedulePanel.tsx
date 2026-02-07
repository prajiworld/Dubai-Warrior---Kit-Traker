import React from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { KitStatus } from '../types';
import { formatDate } from '../utils/helpers';
import StatusBadge from './StatusBadge';
import { CalendarIcon, ClockIcon, UserCircleIcon } from './Icons';

interface MatchSchedulePanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    actions: {
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
    };
}

const MatchSchedulePanel: React.FC<MatchSchedulePanelProps> = ({ currentUser, teamMembers, kitTracker, actions }) => {
    const upcomingMatch = kitTracker
        .filter(k => [KitStatus.Upcoming, KitStatus.Scheduled].includes(k.Status))
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())[0];

    const getMemberName = (memberId: string) => teamMembers.find(m => m.MemberID === memberId)?.Name || 'N/A';

    const renderUserActions = (match: KitTrackerEntry) => {
        if (!match || match.Status !== KitStatus.Upcoming) return null;

        const isCurrentUserProvisional = match.ProvisionalAssignee === currentUser.MemberID;
        const isKitResponsibleSet = !!match.KitResponsible;

        if (isCurrentUserProvisional && !isKitResponsibleSet) {
            return (
                <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Please respond to the kit duty request:</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => actions.confirmKitDuty(match.Date)} 
                            className="w-full px-4 py-2 text-sm font-semibold text-white bg-status-green rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                        >
                            Confirm Kit Duty
                        </button>
                        <button 
                            onClick={() => actions.declineKitDuty(match.Date)} 
                            className="w-full px-4 py-2 text-sm font-semibold text-white bg-status-red rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
                        >
                            Decline Kit Duty
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    if (!upcomingMatch) {
        return (
            <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Upcoming Matches</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The schedule is clear. Check back later for new match dates.</p>
            </div>
        );
    }
    
    const { Date: date, ProvisionalAssignee, KitResponsible, Notes, Status, Reason } = upcomingMatch;
    const responsibleName = getMemberName(KitResponsible);
    const provisionalName = getMemberName(ProvisionalAssignee);
    const isDecided = !!KitResponsible;

    const today = new Date().toISOString().split('T')[0];
    let displayStatus: KitStatus | 'Match Day' = Status;
    if (Status === KitStatus.Upcoming && date === today) {
        displayStatus = 'Match Day';
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-brand-primary">Next Match</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatDate(date)}</p>
                </div>
                <StatusBadge status={displayStatus} />
            </div>
            
            <dl className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8">
                <div className="sm:col-span-1 flex items-start">
                    <UserCircleIcon className="h-6 w-6 text-gray-400 mr-3 mt-0.5" />
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kit Duty</dt>
                        <dd className={`mt-1 text-base font-semibold ${isDecided ? 'text-status-green' : 'text-status-yellow'}`}>
                            {isDecided ? responsibleName : `${provisionalName || 'Not Assigned'} ${Status === KitStatus.Scheduled ? '(Scheduled)' : '(Pending)'}`}
                        </dd>
                    </div>
                </div>
                <div className="sm:col-span-1 flex items-start">
                    <ClockIcon className="h-6 w-6 text-gray-400 mr-3 mt-0.5" />
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-200">{Reason}</dd>
                    </div>
                </div>
                <div className="sm:col-span-1 flex items-start">
                    <CalendarIcon className="h-6 w-6 text-gray-400 mr-3 mt-0.5" />
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                        <dd className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-200">{Status}</dd>
                    </div>
                </div>
                {Notes && (
                   <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Match Notes</dt>
                        <dd className="mt-1 text-base text-gray-700 dark:text-gray-300 prose prose-sm max-w-none">
                            <p>{Notes}</p>
                        </dd>
                    </div>
                )}
            </dl>

            {renderUserActions(upcomingMatch)}
        </div>
    );
};

export default MatchSchedulePanel;