import React from 'react';
import DataManagementPanel from './DataManagementPanel';
import { TeamMember, KitTrackerEntry } from '../types';

interface MasterDataPageProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    actions: any;
}

const MasterDataPage: React.FC<MasterDataPageProps> = ({ teamMembers, kitTracker, actions }) => {
  return (
    <div>
      <DataManagementPanel teamMembers={teamMembers} kitTracker={kitTracker} actions={actions} />
    </div>
  );
};

export default MasterDataPage;
