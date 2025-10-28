import React from 'react';
import AdminPanel from './AdminPanel';
import UserPanel from './UserPanel';
import { TeamMember, KitTrackerEntry, Arrival } from '../types';

interface KitArrivalPageProps {
    currentUser: TeamMember;
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    arrivals: Arrival[];
    userActions: any;
    adminActions: any;
}

const KitArrivalPage: React.FC<KitArrivalPageProps> = ({ currentUser, teamMembers, kitTracker, arrivals, userActions, adminActions }) => {
  return (
    <div>
      {currentUser.IsAdmin ? (
        <AdminPanel teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={adminActions} />
      ) : (
        <UserPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={userActions} />
      )}
    </div>
  );
};

export default KitArrivalPage;
