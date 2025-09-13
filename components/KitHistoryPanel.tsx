import React from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { KitStatus } from '../types';
import { formatDate } from '../utils/helpers';
import StatusBadge from './StatusBadge';
import { WhatsAppIcon } from './Icons';

interface KitHistoryPanelProps {
  teamMembers: TeamMember[];
  kitTracker: KitTrackerEntry[];
  actions: {
    notifyNextPlayer: (matchDate: string) => void;
  }
}

const KitHistoryPanel: React.FC<KitHistoryPanelProps> = ({ teamMembers, kitTracker, actions }) => {

  const getMemberName = (memberId: string): string => {
    return teamMembers.find(m => m.MemberID === memberId)?.Name || 'N/A';
  };
  
  const upcomingMatch = kitTracker
    .filter(k => [KitStatus.Upcoming, KitStatus.Scheduled].includes(k.Status))
    .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())[0];

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h3 className="text-xl font-bold">Kit Rotation History</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track the entire history of kit duty assignments.</p>
        </div>
        <button
          onClick={() => upcomingMatch && actions.notifyNextPlayer(upcomingMatch.Date)}
          disabled={!upcomingMatch}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <WhatsAppIcon />
          Notify Next Player
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Match Date</th>
              <th className="px-4 py-3">Assigned (Provisional)</th>
              <th className="px-4 py-3">Actual Carrier</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-center">Weeks Held</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {kitTracker
              .sort((a, b) => {
                if (a.Status === KitStatus.Completed && b.Status !== KitStatus.Completed) return -1;
                if (b.Status === KitStatus.Completed && a.Status !== KitStatus.Completed) return 1;
                return new Date(b.Date).getTime() - new Date(a.Date).getTime();
              })
              .map(entry => {
                const provisionalName = getMemberName(entry.ProvisionalAssignee);
                const responsibleName = getMemberName(entry.KitResponsible);
                const isReassigned = entry.KitResponsible && entry.KitResponsible !== entry.ProvisionalAssignee;

                let displayStatus: KitStatus | 'Match Day' = entry.Status;
                if (entry.Status === KitStatus.Upcoming && entry.Date === today) {
                    displayStatus = 'Match Day';
                }

                return (
                  <tr key={entry.Date} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium">{formatDate(entry.Date)}</td>
                    <td className="px-4 py-3">{provisionalName}</td>
                    <td className={`px-4 py-3 ${isReassigned ? 'font-bold' : ''}`}>
                      {responsibleName || ([KitStatus.Upcoming, KitStatus.Scheduled].includes(entry.Status) ? 'Not Decided' : 'N/A')}
                    </td>
                    <td className="px-4 py-3">{entry.Reason}</td>
                    <td className="px-4 py-3 text-center">{entry.WeeksHeld || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={displayStatus} />
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KitHistoryPanel;