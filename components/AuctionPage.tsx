import React from 'react';
import DWAuctionPlatform from './DWAuctionPlatform';
import { TeamMember } from '../types';

interface AuctionPageProps {
  teamMembers: TeamMember[];
}

const AuctionPage: React.FC<AuctionPageProps> = ({ teamMembers }) => {
  return (
    <div>
      <DWAuctionPlatform teamMembers={teamMembers} />
    </div>
  );
};

export default AuctionPage;
