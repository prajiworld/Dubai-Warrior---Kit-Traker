import React, { useState } from 'react';
import type { Match, TeamMember } from '@/types';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import MatchEditModal from '@/components/MatchEditModal';
import CollapsibleSection from './CollapsibleSection';

interface EnrichedMatch extends Match {
  assignedPlayerName?: string;
  statusWithAdjustment?: string; // New field for display
}

type Column<T> = {
  header: string;
  accessor: Extract<keyof T, string>;
  editable?: boolean;
  type?: 'text' | 'number' | 'boolean' | 'dropdown';
  options?: string[];
  render?: (row: T) => React.ReactNode;
};

interface MatchesSectionProps {
  matches: Match[];
  teamMembers: TeamMember[];
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch: (id: string) => void;
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  onRefreshMatches: () => void;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({
  matches,
  teamMembers,
  onUpdateMatch,
  onDeleteMatch,
  onAddMatch,
  onRefreshMatches,
}) => {
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleAddMatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMatch({ id: '', date: '', status: 'Scheduled' });
    setIsMatchModalOpen(true);
  };

  const handleCloseMatchModal = () => {
    setSelectedMatch(null);
    setIsMatchModalOpen(false);
  };

  const handleSaveMatch = (match: Match) => {
    if (match.id) {
      onUpdateMatch(match);
    } else {
      const { id, ...newMatch } = match;
      onAddMatch(newMatch);
    }
    handleCloseMatchModal();
  };
  
  const handleDeleteMatch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      onDeleteMatch(id);
    }
  };

  const enrichedMatches: EnrichedMatch[] = matches.map((match) => ({
    ...match,
    assignedPlayerName:
      teamMembers.find((m) => m.MemberID === match.assignedPlayer)?.Name ||
      'Unassigned',
    statusWithAdjustment: match.status
  }));

  const matchScheduleColumns: Column<EnrichedMatch>[] = [
    { header: 'Date', accessor: 'date' },
    { 
        header: 'Status', 
        accessor: 'statusWithAdjustment',
        render: (row) => (
            <div>
                <div>{row.status}</div>
                {row.adjustmentStatus && (
                    <div className="text-xs text-orange-600 font-medium">
                        {row.adjustmentStatus}
                    </div>
                )}
            </div>
        )
    },
    { header: 'Assigned Player', accessor: 'assignedPlayerName' },
  ];

  const getAvailablePlayersForModal = () => {
    // If adding a new match, no one is assigned yet to *this* new match
    // so we just return everyone.
    if (!selectedMatch || !selectedMatch.id) return teamMembers;

    const assignedPlayerIDs = new Set(
      matches
        .filter(
          (m) =>
            m.id !== selectedMatch.id &&
            (m.status === 'Scheduled' || m.status === 'Upcoming') &&
            m.assignedPlayer
        )
        .map((m) => m.assignedPlayer)
    );
    return teamMembers.filter(
      (member) => !assignedPlayerIDs.has(member.MemberID)
    );
  };

  return (
    <CollapsibleSection
      title="Match Schedule"
      isOpen={false}
    >
      <div className="flex justify-end space-x-2 mb-4">
        <Button onClick={handleAddMatchClick}>Add New Match</Button>
        <Button onClick={onRefreshMatches} variant="outline">Reset</Button>
      </div>

      <DataTable<EnrichedMatch>
        title=""
        data={enrichedMatches}
        columns={matchScheduleColumns}
        idAccessor="id"
        onEdit={handleEditMatch}
        onDelete={handleDeleteMatch}
      />

      {isMatchModalOpen && selectedMatch && (
        <MatchEditModal
          match={selectedMatch}
          teamMembers={getAvailablePlayersForModal()}
          onSave={handleSaveMatch}
          onClose={handleCloseMatchModal}
        />
      )}
    </CollapsibleSection>
  );
};

export default MatchesSection;
