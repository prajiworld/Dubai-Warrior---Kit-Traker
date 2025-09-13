import React from 'react';
import type { TeamMember } from '../types';
import { MemberStatus } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

interface KitRotationSchedulePanelProps {
  teamMembers: TeamMember[];
  readOnly: boolean;
  actions?: {
    moveMemberUp: (memberId: string) => void;
    moveMemberDown: (memberId: string) => void;
  };
}

const KitRotationSchedulePanel: React.FC<KitRotationSchedulePanelProps> = ({ teamMembers, readOnly, actions }) => {
  const rotationList = teamMembers
    .filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active)
    .sort((a, b) => a.Order - b.Order);
  
  const nextUpIndex = rotationList.findIndex(m => !m.CompletedInRound);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">{readOnly ? 'Upcoming Kit Rotation' : 'Manage Kit Rotation Schedule'}</h3>
      <div className="space-y-2">
        {rotationList.length > 0 ? (
          rotationList.map((member, index) => (
            <div
              key={member.MemberID}
              className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center">
                <span className="font-mono text-sm text-gray-500 dark:text-gray-400 w-8">{index + 1}.</span>
                <span className={`font-semibold ${member.CompletedInRound ? 'line-through text-gray-500' : ''}`}>
                  {member.Name}
                </span>
                {index === nextUpIndex && (
                    <span className="ml-3 px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-100 dark:bg-blue-600 rounded-full">
                        Next Up
                    </span>
                )}
              </div>
              {!readOnly && actions && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => actions.moveMemberUp(member.MemberID)}
                    disabled={index === 0}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Move ${member.Name} up`}
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => actions.moveMemberDown(member.MemberID)}
                    disabled={index === rotationList.length - 1}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Move ${member.Name} down`}
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No players eligible for rotation.</p>
        )}
      </div>
       {!readOnly && (
         <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Use the arrows to adjust the upcoming rotation order. This changes the sequence for future matches.
         </p>
       )}
    </div>
  );
};

export default KitRotationSchedulePanel;
