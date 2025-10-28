import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, child, Unsubscribe, update } from 'firebase/database';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut, User as FirebaseUser, createUserWithEmailAndPassword } from "firebase/auth";
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { MemberStatus, KitStatus, AssignmentReason } from '../types';
import LoginPage from '../components/LoginPage';
import SignUpModal, { NewUserData } from '../components/SignUpPage';
import DashboardShell from '../components/DashboardShell';
import UserPanel from '../components/UserPanel';
import AdminPanel from '../components/AdminPanel';
import UserProfile from '../components/UserProfile';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import NotificationModal from '../components/NotificationModal';
import { getDistanceInMeters } from '../utils/helpers';
import DWMatchCenterPlatform from '../components/DWMatchCenterPlatform';
import DWAuctionPlatform from '../components/DWAuctionPlatform';
import MasterDataPage from '../components/MasterDataPage';

const App: React.FC = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [kitTracker, setKitTracker] = useState<KitTrackerEntry[]>([]);
    const [arrivals, setArrivals] = useState<Arrival[]>([]);
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationInfo, setNotificationInfo] = useState<{ assignee: TeamMember; match: KitTrackerEntry; groupMessage: string; directMessage: string; } | null>(null);

    useEffect(() => {
        let unsubscribers: Unsubscribe[] = [];
        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            unsubscribers.forEach(unsub => unsub());
            unsubscribers = [];

            if (firebaseUser) {
                const teamMembersRef = ref(db, 'teamMembers');
                const kitTrackerRef = ref(db, 'kitTracker');
                const arrivalsRef = ref(db, 'arrivals');

                const teamMembersUnsub = onValue(teamMembersRef, (snapshot) => {
                    const membersData = snapshot.val();
                    const membersList = membersData ? Object.values(membersData) as TeamMember[] : [];
                    setTeamMembers(membersList);
                    const userProfile = membersList.find(m => m.MemberID === firebaseUser.uid);
                    if (userProfile) {
                        setCurrentUser(userProfile);
                    } else {
                        const newUserRef = ref(db, `teamMembers/${firebaseUser.uid}`);
                        const maxOrder = Math.max(...membersList.map(m => m.Order).filter(Number.isFinite), 0);
                        const newUser: TeamMember = {
                            MemberID: firebaseUser.uid, Name: firebaseUser.email?.split('@')[0] || 'New User',
                            username: firebaseUser.email || '', email: firebaseUser.email || '', password: '', Role: 'Player',
                            IsAdmin: false, PhoneNumber: firebaseUser.phoneNumber || '', OwnsCar: false,
                            Status: MemberStatus.Active, RotationEligible: 'No', PenaltyEligible: true,
                            Order: maxOrder + 1, CompletedInRound: false, Notes: 'New user created on sign-up.',
                            DWCategory: "Main (All-Rounder)",
                        };
                        set(newUserRef, newUser).then(() => setCurrentUser(newUser));
                    }
                    setIsLoading(false);
                });

                const kitTrackerUnsub = onValue(kitTrackerRef, (snapshot) => setKitTracker(snapshot.val() ? Object.values(snapshot.val()) : []));
                const arrivalsUnsub = onValue(arrivalsRef, (snapshot) => setArrivals(snapshot.val() ? Object.values(snapshot.val()) : []));
                unsubscribers = [teamMembersUnsub, kitTrackerUnsub, arrivalsUnsub];
            } else {
                setCurrentUser(null);
                setTeamMembers([]);
                setKitTracker([]);
                setArrivals([]);
                setIsLoading(false);
                setAuthPage('login');
            }
        });
        return () => authUnsubscribe();
    }, []);

    const handleLogout = () => signOut(auth);
    
    const handleSignUp = (userData: NewUserData): boolean => {
        const usernameExists = teamMembers.some(
            member => member.username.toLowerCase() === userData.username.toLowerCase()
        );

        if (usernameExists) {
            return false; 
        }

        createUserWithEmailAndPassword(auth, userData.email, userData.password)
            .then(userCredential => {
                const user = userCredential.user;
                const maxOrder = Math.max(...teamMembers.map(m => m.Order).filter(isFinite), 0);

                const newUser: TeamMember = {
                    MemberID: user.uid,
                    Name: userData.Name,
                    username: userData.username.trim(),
                    email: userData.email.trim(),
                    password: '',
                    PhoneNumber: userData.PhoneNumber,
                    Role: 'Player',
                    IsAdmin: false,
                    OwnsCar: false,
                    Status: MemberStatus.Active,
                    RotationEligible: 'No',
                    PenaltyEligible: true,
                    Order: maxOrder + 1,
                    CompletedInRound: false,
                    Notes: 'New user from sign-up form.',
                    DWCategory: "Main (All-Rounder)",
                };

                set(ref(db, `teamMembers/${user.uid}`), newUser);
                setAuthPage('login');
            })
            .catch(error => {
                console.error('Firebase sign-up error:', error);
                alert(`Error during sign-up: ${error.message}`);
            });

        return true;
    };

    const handleUpdateProfile = (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
        if (!currentUser) return;
        const userRef = ref(db, `teamMembers/${currentUser.MemberID}`);
        const updates: Partial<TeamMember> = {
            PhoneNumber: updatedData.PhoneNumber,
            OwnsCar: updatedData.OwnsCar
        };
        update(userRef, updates).then(() => {
            alert('Profile updated!');
            setCurrentPage('dashboard');
        });
    };

    const handleConfirmKitDuty = (matchDate: string) => {
        if (!currentUser) return;
        update(ref(db, `kitTracker/${matchDate}`), { KitResponsible: currentUser.MemberID }).then(() => alert('You have confirmed kit duty!'));
    };

    const handleDeclineKitDuty = (matchDate: string) => {
        if (!currentUser) return;
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match) return;
        const updates = { ProvisionalAssignee: '', Notes: `${match.Notes || ''} ${currentUser.Name} declined duty.`.trim(), Reason: AssignmentReason.Reassigned };
        update(ref(db, `kitTracker/${matchDate}`), updates).then(() => alert('You have declined kit duty. The admin will reassign it.'));
    };

    const handleCheckIn = (matchDate: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match || !currentUser) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const distance = getDistanceInMeters(latitude, longitude, match.GroundLatLong.lat, match.GroundLatLong.lng);
                if (distance <= match.GeoRadiusMeters) {
                    const now = new Date().toISOString();
                    const arrivalId = `arr-${currentUser.MemberID}-${matchDate}`;
                    const newArrival: Arrival = { ArrivalID: arrivalId, MatchDate: matchDate, Member: currentUser.MemberID, ArrivalTime: now, CheckInLatLong: { lat: latitude, lng: longitude } };
                    set(ref(db, `arrivals/${arrivalId}`), newArrival).then(() => alert(`Checked in at ${new Date(now).toLocaleTimeString()}`));
                } else {
                    alert(`Check-in failed. You are ${Math.round(distance)} meters away from the ground. Please get closer.`);
                }
            },
            () => alert("Geolocation failed. Please enable location services and try again.")
        );
    };

    const handleNotifyNextPlayer = (matchDate: string) => {
        alert("Notification feature not yet implemented.");
    };

    const addTeamMember = (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound' | 'username'> & { username?: string }) => {
        const newMemberId = push(child(ref(db), 'teamMembers')).key;
        if (!newMemberId) return;

        const newMember: TeamMember = {
            ...memberData,
            MemberID: newMemberId,
            CompletedInRound: false,
            username: memberData.username || memberData.email.split('@')[0],
        };

        set(ref(db, `teamMembers/${newMemberId}`), newMember);
    };

    const updateTeamMember = (member: TeamMember) => set(ref(db, `teamMembers/${member.MemberID}`), member);
    const deleteTeamMember = (memberId: string) => set(ref(db, `teamMembers/${memberId}`), null);
    
    const handleAddMatch = (matchData: Omit<KitTrackerEntry, 'Date'> & { Date: string }) => {
        const newMatch: KitTrackerEntry = { ...matchData, ProvisionalAssignee: '', KitResponsible: '', TakenOnBehalfOf: '', Status: KitStatus.Scheduled, WeeksHeld: 0, MatchOn: false, Reason: AssignmentReason.Rotation };
        set(ref(db, `kitTracker/${matchData.Date}`), newMatch);
    };

    const updateMatch = (match: KitTrackerEntry) => set(ref(db, `kitTracker/${match.Date}`), match);
    const deleteMatch = (date: string) => {
        set(ref(db, `kitTracker/${date}`), null);
        arrivals.filter(a => a.MatchDate === date).forEach(a => set(ref(db, `arrivals/${a.ArrivalID}`), null));
    };

    const handleAssignPlayerToMatch = (memberId: string, matchDate: string) => update(ref(db, `kitTracker/${matchDate}`), { ProvisionalAssignee: memberId });
    const handleConfirmMatchStatus = (matchDate: string, newStatus: KitStatus.Upcoming | KitStatus.NoPlay) => {
        update(ref(db, `kitTracker/${matchDate}`), { Status: newStatus, MatchOn: newStatus === KitStatus.Upcoming });
    };
    const handleReassignKit = (matchDate: string, newMemberId: string) => update(ref(db, `kitTracker/${matchDate}`), { KitResponsible: newMemberId });

    const userActions = { confirmKitDuty: handleConfirmKitDuty, declineKitDuty: handleDeclineKitDuty, checkIn: handleCheckIn, notifyNextPlayer: handleNotifyNextPlayer };
    const adminActions = { addTeamMember, updateTeamMember, deleteTeamMember, addMatch: handleAddMatch, updateMatch, deleteMatch, assignPlayerToMatch: handleAssignPlayerToMatch, confirmMatchStatus: handleConfirmMatchStatus, reassignKit: handleReassignKit, notifyNextPlayer: handleNotifyNextPlayer, addBulkMatches: () => alert('Bulk add not implemented'), addBulkTeamMembers: () => alert('Bulk add not implemented'), applyLatePenalty: () => alert('Penalty not implemented'), confirmHandover: () => alert('Handover not implemented') };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900"><p className="text-white">Loading Application...</p></div>;
    }

    if (!currentUser) {
        return (
            <>
                <LoginPage 
                    onShowSignUp={() => setAuthPage('signup')}
                    onShowForgotPassword={() => setShowForgotPassword(true)} 
                />
                {authPage === 'signup' && (
                    <SignUpModal 
                        onSignUp={handleSignUp} 
                        onClose={() => setAuthPage('login')} 
                    />
                )}
                {showForgotPassword && <ForgotPasswordModal teamMembers={teamMembers} onClose={() => setShowForgotPassword(false)} />}
            </>
        );
    }

    const pageContent = () => {
        switch (currentPage) {
            case 'profile':
                return <UserProfile currentUser={currentUser} onUpdateProfile={handleUpdateProfile} onBack={() => setCurrentPage('dashboard')} />;
            case 'match-center':
                return <DWMatchCenterPlatform />;
            case 'auction':
                return <DWAuctionPlatform teamMembers={teamMembers} />;
            case 'master-data':
                return <MasterDataPage teamMembers={teamMembers} kitTracker={kitTracker} actions={adminActions} />;
            case 'dashboard':
            default:
                return currentUser.IsAdmin
                    ? <AdminPanel teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={adminActions} />
                    : <UserPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={userActions} />;
        }
    };

    return (
        <>
            <DashboardShell 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onNavigate={setCurrentPage}
            >
                {pageContent()}
            </DashboardShell>
            {notificationInfo && <NotificationModal assignee={notificationInfo.assignee} directMessage={notificationInfo.directMessage} groupMessage={notificationInfo.groupMessage} onClose={() => setNotificationInfo(null)} />}
        </>
    );
};

export default App;
