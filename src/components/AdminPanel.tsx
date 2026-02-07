import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry, Penalty } from '../types';
import { KitStatus } from '../types';
import { formatDate } from '../utils/helpers';
import KitHistoryPanel from './KitHistoryPanel';
import MatchSchedulePanel from './MatchSchedulePanel';

interface AdminPanelProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    penalizedPlayers: Penalty[];
    actions: {
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
        assignPlayerToMatch: (memberId: string, matchDate: string) => void;
        confirmMatchStatus: (matchDate: string, newStatus: KitStatus.Upcoming | KitStatus.NoPlay) => void;
        reassignKit: (matchDate: string, newMemberId: string) => void;
        confirmHandover: (matchDate: string) => void;
        notifyNextPlayer: (matchDate: string) => void;
        addPenalty: (memberId: string, notes: string, matchDate?: string) => void;
        removePenalty: (penaltyId: string) => void;
        confirmKitDuty: (matchDate: string) => void;
        declineKitDuty: (matchDate: string) => void;
    };
}

type AdminTab = 'dashboard'| 'schedules';
type ModalContent = 'reassign' | 'penalty' | 'notify' | 'confirm';

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, teamMembers, kitTracker, penalizedPlayers, actions }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ModalContent | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [penaltyMemberId, setPenaltyMemberId] = useState('');
    const [penaltyNotes, setPenaltyNotes] = useState('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter for upcoming/scheduled matches AND sort them by date (ascending)
    const upcomingMatches = kitTracker
        .filter(k => {
             const matchDate = new Date(k.Date);
             matchDate.setHours(0, 0, 0, 0);
             return matchDate >= today && [KitStatus.Scheduled, KitStatus.Upcoming].includes(k.Status);
        })
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    // The match to control is the very first upcoming match
    const nextMatchForControl = upcomingMatches[0];
    
    // Fallback to most recent past match if no upcoming match exists
    const mostRecentPastMatch = [...kitTracker]
        .filter(k => new Date(k.Date).getTime() < today.getTime())
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];
    
    const matchForControlPanel = nextMatchForControl || mostRecentPastMatch;

    const openModal = (content: ModalContent) => {
        setModalContent(content);

        if (content === 'reassign' || content === 'penalty') {
            if (matchForControlPanel) {
                const defaultAssignee =
                    matchForControlPanel.KitResponsible ||
                    matchForControlPanel.ProvisionalAssignee ||
                    '';
                setSelectedMemberId(defaultAssignee);
            } else {
                setSelectedMemberId('');
            }
        }

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
        setSelectedMemberId('');
    };

    const handleConfirm = () => {
        if (!matchForControlPanel || !modalContent) return;

        switch (modalContent) {
            case 'reassign':
                if (selectedMemberId) {
                    actions.reassignKit(matchForControlPanel.Date, selectedMemberId);
                }
                break;
            case 'penalty':
                if (selectedMemberId) {
                    const defaultNotes = `Late for match on ${formatDate(matchForControlPanel.Date)}`;
                    actions.addPenalty(selectedMemberId, defaultNotes, matchForControlPanel.Date);
                }
                break;
            case 'notify':
                actions.notifyNextPlayer(matchForControlPanel.Date);
                break;
            case 'confirm':
                actions.confirmHandover(matchForControlPanel.Date);
                break;
        }
        closeModal();
    };

    const handleAddPenalty = () => {
        if (penaltyMemberId) {
            actions.addPenalty(penaltyMemberId, penaltyNotes);
            setPenaltyMemberId('');
            setPenaltyNotes('');
        }
    };

    const TabButton: React.FC<{ tabName: AdminTab, label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`${activeTab === tabName
                    ? 'border-brand-accent text-brand-primary dark:text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === tabName ? 'page' : undefined}
        >
            {label}
        </button>
    );
    
    const renderMatchControls = () => {
        if (!matchForControlPanel) return null;
    
        if (matchForControlPanel.Status === KitStatus.Scheduled) {
            return (
                <div className="bg-yellow-100 dark:bg-yellow-900/50 p-6 rounded-lg shadow-lg border border-yellow-400 dark:border-yellow-700">
                    <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">Action Required: Confirm Status</h3>
                    <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        Please confirm if the match on <span className="font-semibold">{formatDate(matchForControlPanel.Date)}</span> is happening.
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => actions.confirmMatchStatus(matchForControlPanel.Date, KitStatus.Upcoming)}
                            className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
                        >
                            ✔ Confirm Match is ON
                        </button>
                        <button
                            onClick={() => actions.confirmMatchStatus(matchForControlPanel.Date, KitStatus.NoPlay)}
                            className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
                        >
                            ✖ Mark as No Play
                        </button>
                    </div>
                </div>
            );
        }
    
        const buttonStyle = "px-4 py-2 text-sm font-semibold text-white rounded-md flex-grow";
    
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <h3 className="text-xl font-bold">Actions for {formatDate(matchForControlPanel.Date)}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onClick={() => openModal('penalty')} className={`${buttonStyle} bg-yellow-600 hover:bg-yellow-700`}>Apply Late Penalty</button>
                    <button onClick={() => openModal('reassign')} className={`${buttonStyle} bg-indigo-600 hover:bg-indigo-700`}>🔄 Reassign Kit</button>
                    <button onClick={() => openModal('notify')} className={`${buttonStyle} bg-blue-600 hover:bg-blue-700`}>Notify Player</button>
                    <button onClick={() => openModal('confirm')} className={`${buttonStyle} bg-green-600 hover:bg-green-700`}>✔ Confirm Handover</button>
                </div>
            </div>
        );
    };

    const renderModal = () => {
        if (!isModalOpen || !modalContent) return null;

        const titles: Record<ModalContent, string> = {
            reassign: 'Reassign Kit Duty',
            penalty: 'Apply Late Penalty',
            notify: 'Notify Next Player',
            confirm: 'Confirm Kit Handover',
        };

        return (
             <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">{titles[modalContent]}</h3>
                    <div className="space-y-4">
                        {(modalContent === 'reassign' || modalContent === 'penalty') && (
                            <div>
                                <label htmlFor="member-select" className="sr-only">Select Member</label>
                                <select
                                    id="member-select"
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                >
                                    <option value="">Select Member</option>
                                    {teamMembers.map(m => <option key={m.MemberID} value={m.MemberID}>{m.Name}</option>)}
                                </select>
                            </div>
                        )}
                        {modalContent === 'notify' && <p>This will send a notification to the next player in line. Proceed?</p>}
                        {modalContent === 'confirm' && <p>Are you sure you want to confirm the kit handover for this match?</p>}

                        <div className="flex justify-end gap-4 mt-4">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-500">Cancel</button>
                            <button 
                                onClick={handleConfirm} 
                                disabled={(modalContent === 'reassign' || modalContent === 'penalty') && !selectedMemberId}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                            >Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderPenaltiesSection = () => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-bold">Penalties</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                    <label htmlFor="penalty-member" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Member</label>
                    <select
                        id="penalty-member"
                        value={penaltyMemberId}
                        onChange={(e) => setPenaltyMemberId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="">Select Member</option>
                        {teamMembers.filter(m => m.PenaltyEligible).map(m => <option key={m.MemberID} value={m.MemberID}>{m.Name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="penalty-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Penalty Notes</label>
                    <input
                        type="text"
                        id="penalty-notes"
                        value={penaltyNotes}
                        onChange={(e) => setPenaltyNotes(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g., Late for match"
                    />
                </div>
                <div className="md:col-span-1">
                    <button
                        onClick={handleAddPenalty}
                        disabled={!penaltyMemberId}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        Add Penalty
                    </button>
                </div>
            </div>
            <div className="mt-6">
                <h4 className="text-lg font-semibold">Penalized Players</h4>
                <div className="overflow-x-auto mt-2">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Player</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Match Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Notes</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Remove</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                            {penalizedPlayers.map(penalty => {
                                const member = teamMembers.find(m => m.MemberID === penalty.MemberID);
                                return (
                                    <tr key={penalty.PenaltyID}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {member ? member.Name : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {formatDate(penalty.MatchDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {penalty.Notes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {penalty.Status}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => actions.removePenalty(penalty.PenaltyID)} 
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );


    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <TabButton tabName="dashboard" label="Dashboard" />
                    <TabButton tabName="schedules" label="Schedules" />
                </nav>
            </div>

            <div>
                 {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {renderMatchControls()}
                        <MatchSchedulePanel
                            currentUser={currentUser}
                            teamMembers={teamMembers}
                            kitTracker={kitTracker}
                            actions={{
                                confirmKitDuty: actions.confirmKitDuty,
                                declineKitDuty: actions.declineKitDuty,
                            }}
                        />
                        {renderPenaltiesSection()}
                    </div>
                )}
                {activeTab === 'schedules' && (
                    <KitHistoryPanel
                        teamMembers={teamMembers}
                        kitTracker={kitTracker}
                        penalizedPlayers={penalizedPlayers}
                        actions={{ 
                            notifyNextPlayer: actions.notifyNextPlayer,
                        }}
                    />
                )}
            </div>
             {renderModal()}
        </div>
    );
};

export default AdminPanel;
