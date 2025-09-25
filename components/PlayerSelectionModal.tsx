import React from 'react';
import type { TeamMember } from '../types';
import { XCircleIcon } from './Icons';

interface PlayerSelectionModalProps {
    title: string;
    teamMembers: TeamMember[];
    onSelect: (memberId: string) => void;
    onClose: () => void;
}

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({ title, teamMembers, onSelect, onClose }) => {
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

export default PlayerSelectionModal;
