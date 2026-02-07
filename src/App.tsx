
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardShell from './components/DashboardShell';
import MatchSchedulePanel from './components/MatchSchedulePanel';
import KitHistoryPanel from './components/KitHistoryPanel';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import MasterDataPage from './components/MasterDataPage';
import UserProfile from './components/UserProfile';
import NotificationModal from './components/NotificationModal';
import { Toaster, toast } from 'react-hot-toast';
import { TeamMember, KitTrackerEntry, Penalty, KitStatus, MemberStatus, Match, AssignmentReason } from './types';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER } from './constants';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, set, update, remove, get } from 'firebase/database';
import { formatDate } from './utils/helpers';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [kitTracker, setKitTracker] = useState<KitTrackerEntry[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [notificationData, setNotificationData] = useState<{ assignee: TeamMember, directMessage: string, groupMessage: string } | null>(null);

  // Helper to seed initial data if database is empty
  const seedInitialData = async () => {
    try {
      const membersSnap = await get(ref(db, 'teamMembers'));
      if (!membersSnap.exists()) {
        const initialMembersMap = INITIAL_TEAM_MEMBERS.reduce((acc, m) => ({ ...acc, [m.MemberID]: m }), {});
        await set(ref(db, 'teamMembers'), initialMembersMap);
        console.log("Seeded initial team members.");
      }

      const kitSnap = await get(ref(db, 'kitTracker'));
      if (!kitSnap.exists()) {
        const initialKitMap = INITIAL_KIT_TRACKER.reduce((acc, k) => ({ ...acc, [k.id]: k }), {});
        await set(ref(db, 'kitTracker'), initialKitMap);
        console.log("Seeded initial kit tracker data.");
      }
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthLoading(false);
      if (!firebaseUser) {
        setCurrentUser(null);
      } else {
        // Once logged in, try to seed data if it's the first run
        seedInitialData();
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync Data when Authenticated
  useEffect(() => {
    if (authLoading) return;

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setTeamMembers([]);
      setKitTracker([]);
      setPenalties([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const membersRef = ref(db, 'teamMembers');
    const kitRef = ref(db, 'kitTracker');
    const penaltiesRef = ref(db, 'penalties');

    const unsubMembers = onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      const membersList = data ? Object.values(data) as TeamMember[] : [];
      setTeamMembers(membersList);
      
      const matchedUser = membersList.find(m => m.email.toLowerCase() === firebaseUser.email?.toLowerCase());
      if (matchedUser) {
        if (matchedUser.Status === MemberStatus.Active) {
          setCurrentUser(matchedUser);
        } else {
          toast.error("Your account is inactive.");
          signOut(auth);
        }
      }
      setDataLoading(false);
    }, (error) => {
      console.error("Firebase Read Error (teamMembers):", error);
      setDataLoading(false);
    });

    const unsubKit = onValue(kitRef, (snapshot) => {
      const data = snapshot.val();
      setKitTracker(data ? Object.values(data) as KitTrackerEntry[] : []);
    });

    const unsubPenalties = onValue(penaltiesRef, (snapshot) => {
      const data = snapshot.val();
      setPenalties(data ? Object.values(data) as Penalty[] : []);
    });

    return () => {
      unsubMembers();
      unsubKit();
      unsubPenalties();
    };
  }, [authLoading]);

  const sortedKitTracker = useMemo(() =>
    [...kitTracker].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()),
    [kitTracker]);

  const matches: Match[] = useMemo(() => kitTracker.map(kt => ({
    id: kt.id,
    date: kt.Date,
    status: kt.Status as 'Scheduled' | 'Upcoming' | 'Completed' | 'No Play',
    notes: kt.Notes,
    assignedPlayer: kt.KitResponsible || kt.ProvisionalAssignee,
    adjustmentStatus: kt.adjustmentStatus // Include new field
  })), [kitTracker]);

  const getOrdinalSuffix = (i: number) => {
    const j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
  };

  const adjustFutureAssignments = (
    disruptedMatchDate: string,
    displacedMemberId: string | undefined,
    currentKitTracker: KitTrackerEntry[]
  ) => {
    if (!displacedMemberId) return;

    // 1. Get all FUTURE Scheduled/Upcoming matches AFTER the disrupted date
    const futureMatches = currentKitTracker
        .filter(k => 
            new Date(k.Date) > new Date(disruptedMatchDate) && 
            [KitStatus.Scheduled, KitStatus.Upcoming].includes(k.Status)
        )
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    if (futureMatches.length === 0) return;

    // 2. We have a "queue" of players to assign. 
    //    We start with the displaced member.
    let playerToAssign = displacedMemberId;

    // 3. Iterate through future matches and shift everyone down one slot
    for (const match of futureMatches) {
        const currentlyAssigned = match.ProvisionalAssignee;
        
        // Calculate new adjustment status
        // Extract current count if exists, e.g. "1st Adjustment" -> 1
        const currentStatus = match.adjustmentStatus || "";
        const matchResult = currentStatus.match(/^(\d+)/);
        const currentCount = matchResult ? parseInt(matchResult[1]) : 0;
        const newCount = currentCount + 1;
        const nextAdjustmentLabel = `${newCount}${getOrdinalSuffix(newCount)} Adjustment`;

        update(ref(db, `kitTracker/${match.id}`), {
            ProvisionalAssignee: playerToAssign,
            adjustmentStatus: nextAdjustmentLabel
        });

        // The player we just bumped out is now the one to assign to the NEXT match
        if (currentlyAssigned) {
            playerToAssign = currentlyAssigned;
        } else {
            // If a match had no one assigned, we fill it with our current player and stop shifting
            break; 
        }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    toast.success('You have been logged out.');
  };

  const handleAddTeamMember = (member: Omit<TeamMember, 'MemberID'>, customId?: string) => {
    const MemberID = customId || `T${Date.now()}`;
    const newMember: TeamMember = { ...member, MemberID };
    set(ref(db, `teamMembers/${MemberID}`), newMember);
  };

  const handleUpdateTeamMember = (updatedMember: TeamMember) => {
    update(ref(db, `teamMembers/${updatedMember.MemberID}`), updatedMember);
    toast.success(`${updatedMember.Name} updated.`);
  };

  const handleDeleteTeamMember = (memberId: string) => {
    remove(ref(db, `teamMembers/${memberId}`));
    toast.success('Member removed.');
  };

  const handleAddMatch = (match: Omit<Match, 'id'>) => {
    const id = `M${Date.now()}`;
    const newEntry: KitTrackerEntry = {
      id,
      Date: match.date,
      DueDate: match.date,
      Status: match.status as KitStatus,
      Notes: match.notes,
      KitResponsible: match.assignedPlayer || '',
      GroundLatLong: { lat: 0, lng: 0 },
      GeoRadiusMeters: 250,
      ProvisionalAssignee: match.assignedPlayer || '',
      TakenOnBehalfOf: '',
      MatchOn: true,
      Reason: 'Manual' as any,
    };
    set(ref(db, `kitTracker/${id}`), newEntry);
    toast.success('Match added.');
  };

  const handleUpdateMatch = (updatedMatch: Match) => {
    const entry = kitTracker.find(k => k.id === updatedMatch.id);
    if (entry) {
      // 1. Prepare base update (standard CRUD)
      const updatedEntry: Partial<KitTrackerEntry> = {
        Date: updatedMatch.date,
        DueDate: updatedMatch.date,
        Status: updatedMatch.status as KitStatus,
        Notes: updatedMatch.notes,
      };

      // 2. Determine if the assigned player has changed
      const currentAssignee = entry.ProvisionalAssignee;
      const newAssignee = updatedMatch.assignedPlayer || '';

      if (newAssignee !== currentAssignee) {
          updatedEntry.ProvisionalAssignee = newAssignee;
          updatedEntry.Reason = AssignmentReason.Manual; 
          updatedEntry.reassignmentReason = null as any; 
          
          if (updatedMatch.status !== KitStatus.Completed) {
              updatedEntry.KitResponsible = '';
          } else {
             updatedEntry.KitResponsible = newAssignee;
          }
      } else {
          if (updatedMatch.status === KitStatus.Completed && !entry.KitResponsible) {
              updatedEntry.KitResponsible = entry.ProvisionalAssignee;
          }
      }

      update(ref(db, `kitTracker/${updatedMatch.id}`), updatedEntry);
      toast.success(`Match updated.`);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    remove(ref(db, `kitTracker/${matchId}`));
    toast.success('Match deleted.');
  };

  const handleRefreshMatches = () => {
    const kitRef = ref(db, 'kitTracker');
    const initialMap = INITIAL_KIT_TRACKER.reduce((acc, k) => ({ ...acc, [k.id]: k }), {});
    set(kitRef, initialMap);
    toast.success('Schedule reset.');
  };

  const handleNotifyNextPlayer = (matchDate: string) => {
    const upcomingMatch = kitTracker.find(k => k.Date === matchDate);
    if (!upcomingMatch) return;
    const assignee = teamMembers.find(m => m.MemberID === upcomingMatch.ProvisionalAssignee);
    
    if (assignee) {
        const dateStr = formatDate(upcomingMatch.Date);
        const directMessage = `Hi ${assignee.Name}, this is a reminder that you are assigned the kit duty for the upcoming match on ${dateStr}. Please confirm you are bringing the kit.`;
        const groupMessage = `Kit Duty Reminder: ${assignee.Name} is assigned to bring the kit for the match on ${dateStr}.`;
        
        navigator.clipboard.writeText(groupMessage).then(() => {
            setNotificationData({
                assignee,
                directMessage,
                groupMessage
            });
        }).catch(err => {
             console.error('Could not copy text: ', err);
             setNotificationData({
                assignee,
                directMessage,
                groupMessage
            });
        });
    } else {
        toast.error("No player assigned to notify.");
    }
  };

  const handleConfirmKitDuty = (matchId: string) => {
    const entry = kitTracker.find(k => k.id === matchId);
    if (entry && entry.ProvisionalAssignee === currentUser?.MemberID) {
      update(ref(db, `kitTracker/${matchId}`), {
        Status: KitStatus.Scheduled,
        KitResponsible: entry.ProvisionalAssignee
      });
      toast.success(`Kit duty confirmed.`);
    }
  };

  const handleDeclineKitDuty = (matchId: string) => {
    const entry = kitTracker.find(k => k.id === matchId);
    if (entry && entry.ProvisionalAssignee === currentUser?.MemberID) {
      const activeMembers = teamMembers.filter(m => m.Status === MemberStatus.Active && m.MemberID !== currentUser.MemberID);
      
      if (activeMembers.length > 0) {
        const nextAssignee = activeMembers[Math.floor(Math.random() * activeMembers.length)];
        update(ref(db, `kitTracker/${matchId}`), {
          ProvisionalAssignee: nextAssignee.MemberID
        });
        toast.error(`Kit duty reassigned to ${nextAssignee.Name}.`);
      } else {
        toast.error("No other active members available for reassignment.");
      }
    }
  };

  const handleReassignKit = (matchDate: string, newMemberId: string) => {
    const match = kitTracker.find(k => k.Date === matchDate);
    if (match) {
        const originalAssignee = match.ProvisionalAssignee;
        
        // 1. Update current match
        update(ref(db, `kitTracker/${match.id}`), {
            ProvisionalAssignee: newMemberId,
            KitResponsible: '', 
            Reason: AssignmentReason.Reassigned,
            Status: KitStatus.Scheduled,
            reassignmentReason: 'Admin Reassignment'
        });

        // 2. Cascade update for future matches
        adjustFutureAssignments(match.Date, originalAssignee, kitTracker);

        toast.success(`Kit duty reassigned.`);
    }
  };

  const handleConfirmMatchStatus = (matchDate: string, newStatus: KitStatus) => {
    const match = kitTracker.find(k => k.Date === matchDate);
    if (match) {
        update(ref(db, `kitTracker/${match.id}`), { Status: newStatus });
        
        // If match is NO PLAY, we need to shift the schedule
        if (newStatus === KitStatus.NoPlay) {
            adjustFutureAssignments(match.Date, match.ProvisionalAssignee, kitTracker);
            toast.success(`Match cancelled. Schedule updated.`);
        } else {
            toast.success(`Match status updated to ${newStatus}.`);
        }
    }
  };
  
  const handleConfirmHandover = (matchDate: string) => {
     const match = kitTracker.find(k => k.Date === matchDate);
     if (match) {
         update(ref(db, `kitTracker/${match.id}`), {
             Status: KitStatus.Completed,
             KitResponsible: match.ProvisionalAssignee 
         });
         toast.success('Kit handover confirmed.');
     }
  };

  const handleAddPenalty = (memberId: string, notes: string, matchDate?: string) => {
      const penaltyId = `P${Date.now()}`;
      set(ref(db, `penalties/${penaltyId}`), {
          PenaltyID: penaltyId,
          MemberID: memberId,
          MatchDate: matchDate || new Date().toISOString().split('T')[0],
          Notes: notes,
          Status: 'Pending'
      });
      
      if (matchDate) {
           const match = kitTracker.find(k => k.Date === matchDate);
           if (match) {
               const originalAssignee = match.ProvisionalAssignee;

               update(ref(db, `kitTracker/${match.id}`), {
                   Reason: AssignmentReason.Penalty,
                   KitResponsible: memberId,
                   ProvisionalAssignee: memberId // Force penalty player
               });
               
               // If the penalty player is DIFFERENT from who was supposed to do it,
               // then the original guy was displaced.
               if (originalAssignee && originalAssignee !== memberId) {
                   adjustFutureAssignments(match.Date, originalAssignee, kitTracker);
               }
           }
      }
      
      toast.error(`Penalty applied to member.`);
  };

  const handleRemovePenalty = (penaltyId: string) => {
      remove(ref(db, `penalties/${penaltyId}`));
      toast.success('Penalty removed.');
  };


  const handleUpdateProfile = (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedData };
      update(ref(db, `teamMembers/${currentUser.MemberID}`), updatedData);
      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully.');
    }
  };
  
  const adminActions = {
      addTeamMember: handleAddTeamMember,
      updateTeamMember: handleUpdateTeamMember,
      deleteTeamMember: handleDeleteTeamMember,
      addMatch: handleAddMatch,
      updateMatch: handleUpdateMatch,
      deleteMatch: handleDeleteMatch,
      assignPlayerToMatch: (id: string, date: string) => console.log('Assign', id, date),
      confirmMatchStatus: handleConfirmMatchStatus,
      reassignKit: handleReassignKit,
      confirmHandover: handleConfirmHandover,
      notifyNextPlayer: handleNotifyNextPlayer,
      addPenalty: handleAddPenalty,
      removePenalty: handleRemovePenalty,
      confirmKitDuty: handleConfirmKitDuty,
      declineKitDuty: handleDeclineKitDuty
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Toaster position="bottom-center" />
      {notificationData && (
          <NotificationModal
              assignee={notificationData.assignee}
              directMessage={notificationData.directMessage}
              groupMessage={notificationData.groupMessage}
              onClose={() => setNotificationData(null)}
          />
      )}
      <Routes>
        <Route path="/login" element={
          currentUser ? <Navigate to="/" /> : (
            <>
              <LoginPage 
                onShowSignUp={() => navigate('/signup')} 
                onShowForgotPassword={() => setShowForgotPassword(true)} 
              />
              {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
            </>
          )
        } />
        <Route path="/signup" element={
          currentUser ? <Navigate to="/" /> : (
            <SignUpPage 
              onSignUp={async (userData) => {
                const firebaseUser = auth.currentUser;
                if (!firebaseUser) return false;

                handleAddTeamMember({ 
                  Name: userData.Name, 
                  username: userData.username, 
                  email: userData.email, 
                  Role: 'Player', 
                  IsAdmin: false, 
                  PhoneNumber: userData.PhoneNumber, 
                  OwnsCar: false, 
                  Status: MemberStatus.Active, 
                  RotationEligible: 'Yes', 
                  PenaltyEligible: true, 
                  Order: teamMembers.length + 1, 
                  DWCategory: 'Main (All-Rounder)' 
                }, firebaseUser.uid);
                
                return true;
              }} 
              onClose={() => navigate('/login')} 
            />
          )
        } />
        <Route path="/*" element={currentUser ?
          <DashboardShell currentUser={currentUser} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={
                 currentUser.IsAdmin ? (
                    <AdminPanel 
                        currentUser={currentUser}
                        teamMembers={teamMembers}
                        kitTracker={sortedKitTracker}
                        penalizedPlayers={penalties}
                        actions={adminActions}
                    />
                 ) : (
                <>
                  <MatchSchedulePanel
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    kitTracker={sortedKitTracker}
                    actions={{ confirmKitDuty: handleConfirmKitDuty, declineKitDuty: handleDeclineKitDuty }}
                  />
                  <div className="mt-8">
                    <KitHistoryPanel 
                      kitTracker={sortedKitTracker} 
                      teamMembers={teamMembers}
                      penalizedPlayers={penalties}
                      actions={{ notifyNextPlayer: handleNotifyNextPlayer }}
                    />
                  </div>
                </>
                 )
              } />
              <Route path="/master-data" element={<MasterDataPage
                teamMembers={teamMembers}
                matches={matches}
                onUpdateTeamMember={handleUpdateTeamMember}
                onUpdateMatch={handleUpdateMatch}
                onDeleteTeamMember={handleDeleteTeamMember}
                onDeleteMatch={handleDeleteMatch}
                onAddMatch={handleAddMatch}
                onAddTeamMember={handleAddTeamMember}
                onRefreshMatches={handleRefreshMatches}
              />} />
              <Route path="/profile" element={
                <UserProfile 
                  currentUser={currentUser} 
                  onUpdateProfile={handleUpdateProfile} 
                  onBack={() => navigate(-1)} 
                />
              } />
            </Routes>
          </DashboardShell> : (
            dataLoading ? (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Syncing user data...</div>
              </div>
            ) : <Navigate to="/login" />
          )
        } />
      </Routes>
    </DndProvider>
  );
};

export default App;
