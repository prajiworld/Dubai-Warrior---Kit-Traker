import React, { useState } from 'react';
import type { TeamMember } from '@/types';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import MemberEditModal from '@/components/MemberEditModal';
import CollapsibleSection from './CollapsibleSection';

type Column<T> = {
  header: string;
  accessor: Extract<keyof T, string>;
  editable?: boolean;
  type?: 'text' | 'number' | 'boolean' | 'dropdown';
  options?: string[];
  render?: (row: T) => React.ReactNode;
};

interface TeamMembersSectionProps {
  teamMembers: TeamMember[];
  onUpdateTeamMember: (member: TeamMember) => void;
  onDeleteTeamMember: (id: string) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'MemberID'>) => void;
}

const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  teamMembers,
  onUpdateTeamMember,
  onDeleteTeamMember,
  onAddTeamMember,
}) => {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsMemberModalOpen(true);
  };

  const handleAddMemberClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMember(null);
    setIsMemberModalOpen(true);
  };

  const handleCloseMemberModal = () => {
    setSelectedMember(null);
    setIsMemberModalOpen(false);
  };

  const handleSaveMember = (
    member: TeamMember | Omit<TeamMember, 'MemberID'>
  ) => {
    if ('MemberID' in member) {
      onUpdateTeamMember(member as TeamMember);
    } else {
      onAddTeamMember(member as Omit<TeamMember, 'MemberID'>);
    }
    handleCloseMemberModal();
  };
  
  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      onDeleteTeamMember(id);
    }
  };

  const teamMemberColumns: Column<TeamMember>[] = [
    { header: 'Order', accessor: 'Order' },
    { header: 'Name', accessor: 'Name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'Role' },
    { header: 'Status', accessor: 'Status' },
    { header: 'Rotation', accessor: 'RotationEligible' },
    {
      header: 'Penalty Box',
      accessor: 'PenaltyEligible',
      render: (row) => (row.PenaltyEligible ? 'Yes' : 'No'),
    },
    {
      header: 'Car Owner',
      accessor: 'OwnsCar',
      render: (row) => (row.OwnsCar ? 'Yes' : 'No'),
    },
    { header: 'DW Category', accessor: 'DWCategory' },
  ];

  return (
    <CollapsibleSection
      title="Team Members"
      isOpen={false}
    >
      <div className="flex justify-end mb-4">
         <Button onClick={handleAddMemberClick}>Add New Team Member</Button>
      </div>

      <DataTable<TeamMember>
        title=""
        data={teamMembers}
        columns={teamMemberColumns}
        idAccessor="MemberID"
        onEdit={handleEditMember}
        onDelete={handleDeleteMember}
      />

      {isMemberModalOpen && (
        <MemberEditModal
          member={
            selectedMember || {
              Name: '',
              email: '',
              Role: 'Player',
              Status: 'Active',
              RotationEligible: 'Yes',
              PenaltyEligible: false,
              OwnsCar: false,
              DWCategory: 'Main (All-Rounder)',
              Order: 0,
            }
          }
          onSave={handleSaveMember}
          onClose={handleCloseMemberModal}
        />
      )}
    </CollapsibleSection>
  );
};

export default TeamMembersSection;
