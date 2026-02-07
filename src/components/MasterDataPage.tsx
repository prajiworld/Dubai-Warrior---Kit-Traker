import React from 'react';
import type { TeamMember, Match } from '@/types';
import TeamMembersSection from './TeamMembersSection';
import MatchesSection from './MatchesSection';

interface MasterDataPageProps {
  teamMembers: TeamMember[];
  matches: Match[];
  onUpdateTeamMember: (member: TeamMember) => void;
  onUpdateMatch: (match: Match) => void;
  onDeleteTeamMember: (id: string) => void;
  onDeleteMatch: (id: string) => void;
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'MemberID'>) => void;
  onRefreshMatches: () => void;
}

const MasterDataPage: React.FC<MasterDataPageProps> = ({
  teamMembers,
  matches,
  onUpdateTeamMember,
  onUpdateMatch,
  onDeleteTeamMember,
  onDeleteMatch,
  onAddMatch,
  onAddTeamMember,
  onRefreshMatches,
}) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Master Data
      </h1>

      <TeamMembersSection 
        teamMembers={teamMembers}
        onUpdateTeamMember={onUpdateTeamMember}
        onDeleteTeamMember={onDeleteTeamMember}
        onAddTeamMember={onAddTeamMember}
      />

      <MatchesSection 
        matches={matches}
        teamMembers={teamMembers}
        onUpdateMatch={onUpdateMatch}
        onDeleteMatch={onDeleteMatch}
        onAddMatch={onAddMatch}
        onRefreshMatches={onRefreshMatches}
      />
    </div>
  );
};

export default MasterDataPage;