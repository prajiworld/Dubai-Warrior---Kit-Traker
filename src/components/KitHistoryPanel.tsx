import React from 'react';
import type { TeamMember, KitTrackerEntry, Penalty } from '../types';
import { KitStatus, AssignmentReason } from '../types';
import { formatDate } from '../utils/helpers';
import StatusBadge from './StatusBadge';
import { WhatsAppIcon } from './Icons';

interface KitHistoryPanelProps {
  teamMembers: TeamMember[];
  kitTracker: KitTrackerEntry[];
  penalizedPlayers: Penalty[];
  actions: {
    notifyNextPlayer: (matchDate: string) => void;
  }
}

const KitHistoryPanel: React.FC<KitHistoryPanelProps> = ({
  teamMembers,
  kitTracker,
  penalizedPlayers = [],
  actions,
}) => {

  const getMemberName = (memberId?: string): string => {
    if (!memberId) return 'N/A';
    return teamMembers.find(m => m.MemberID === memberId)?.Name || 'N/A';
  };

  const upcomingMatch = kitTracker.find(k =>
    [KitStatus.Upcoming, KitStatus.Scheduled].includes(k.Status)
  );

  const getDisplayReason = (match: KitTrackerEntry): AssignmentReason | string => {
    if (match.Reason === AssignmentReason.Penalty) {
      return getPenaltyReason(match);
    }
    if (match.Reason === AssignmentReason.Reassigned) {
      return getReassignedReason(match);
    }
    if (match.ProvisionalAssignee && match.ProvisionalAssignee === match.KitResponsible) {
      return 'Rotation';
    }
    return match.Reason || 'N/A';
  };

  const getPenaltyReason = (match: KitTrackerEntry): string => {
    const responsibleName = getMemberName(match.KitResponsible || match.ProvisionalAssignee);
    const penalty = penalizedPlayers.find(
      p => p.MemberID === match.KitResponsible && p.MatchDate === match.Date
    );
    if (penalty) {
      return `Penalty – ${responsibleName} (${penalty.Status})`;
    }
    return `Penalty – ${responsibleName}`;
  };

  const getReassignedReason = (match: KitTrackerEntry): string => {
    if (match.reassignmentReason) {
      return `Re-assigned (${match.reassignmentReason})`;
    }
    return 'Re-assigned';
  };
  
  const handleNotifyPlayer = (matchDate: string) => {
    if (window.confirm('Are you sure you want to send a notification to the next player?')) {
      actions.notifyNextPlayer(matchDate);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Schedule History</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track the entire history of kit duty assignments.
          </p>
        </div>
        {upcomingMatch && (
          <button
            onClick={() => handleNotifyPlayer(upcomingMatch.Date)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-accent transition-colors"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Notify Next Player
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Match Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned (Provisional)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual Carrier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Reason
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Weeks Held
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {kitTracker.length > 0 ? (
              kitTracker.map(match => (
                <tr
                  key={match.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(match.Date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {getMemberName((match.Reason === AssignmentReason.Rotation && match.KitResponsible) ? match.KitResponsible : match.ProvisionalAssignee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-primary">
                    {getMemberName(match.KitResponsible)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {getDisplayReason(match)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                    {match.WeeksHeld}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusBadge status={match.Status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No historical data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KitHistoryPanel;