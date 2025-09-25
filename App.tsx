import React, { useState, useEffect, useCallback } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus, AssignmentReason } from './types';
import LoginPage from './components/LoginPage';
import DashboardShell from './components/DashboardShell';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import SignUpModal, { type NewUserData } from './components/SignUpModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import NotificationModal from './components/NotificationModal';
import PublicDashboard from './components/PublicDashboard';
import { getDistanceInMeters, formatDate } from './utils/helpers';

const App: React.FC = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [kitTracker, setKitTracker] = useState<KitTrackerEntry[]>([]);
    const [arrivals, setArrivals] = useState<Arrival[]>([]);
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentPage, setCurrentPage] = useState('login'); // 'login', 'dashboard', 'profile', 'public'
    const [showSignUp, setShowSignUp] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [notificationInfo, setNotificationInfo] = useState<{ assignee: TeamMember; match: KitTrackerEntry; groupMessage: string; directMessage: string; } | null>(null);

    const loadData = useCallback(async () => {
        try {
            const response = await fetch('/api/get-data');
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setTeamMembers(data.teamMembers || []);
            setKitTracker(data.kitTracker || []);
            setArrivals(data.arrivals || []);
        } catch (error) {
            console.error("Failed to load data from API", error);
            // Optionally show an error message to the user
        } finally {
            setIsDataLoaded(true);
        }
    }, []);
    
    // Initial data load
    useEffect(() => {
        if (window.location.pathname === '/public') {
            setCurrentPage('public');
        }
        loadData();
    }, [loadData]);

    const performAction = useCallback(async (action: string, payload: any, successMessage?: string) => {
        try {
            const response = await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API action failed');
            }
            if (successMessage) {
                 alert(successMessage);
            }
            await loadData(); // Reload data from DB to reflect changes
            return await response.json();
        } catch (error) {
            console.error(`Failed to perform action ${action}:`, error);
            alert(`An error occurred: ${error.message}`);
            return { success: false, message: error.message };
        }
    }, [loadData]);

    // AUTHENTICATION
    const handleLogin = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const user = await response.json();
                setCurrentUser(user);
                setCurrentPage('dashboard');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('login');
        window.history.pushState({}, '', '/');
    };

    const handleSignUp = async (userData: NewUserData): Promise<boolean> => {
       const result = await performAction('SIGN_UP', { userData });
       if (result.success && result.user) {
            setCurrentUser(result.user);
            setCurrentPage('dashboard');
            setShowSignUp(false);
            return true;
       } else {
            alert(result.message || 'Sign up failed.');
            return false;
       }
    };
    
    // USER ACTIONS
    const handleUpdateProfile = (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
        if (!currentUser) return;
        performAction('UPDATE_PROFILE', { userId: currentUser.MemberID, updatedData }, 'Profile updated!');
        setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
        setCurrentPage('dashboard');
    };
    
    const handleChangePassword = async (passwords: { current: string; new: string }): Promise<{ success: boolean; message: string }> => {
        if (!currentUser) return { success: false, message: 'No user is logged in.' };
        const result = await performAction('CHANGE_PASSWORD', { userId: currentUser.MemberID, passwords });
        if (result.success) {
            // Optimistically update current user object if password change is successful
            setCurrentUser(prev => prev ? { ...prev, password: passwords.new } : null);
        }
        return result;
    };

    const handleConfirmKitDuty = (matchDate: string) => {
        if (!currentUser) return;
        performAction('CONFIRM_KIT_DUTY', { userId: currentUser.MemberID, matchDate }, 'You have confirmed kit duty. Thanks for taking responsibility!');
    };

    const handleDeclineKitDuty = (matchDate: string, newAssigneeId: string) => {
        if (!currentUser) return;
        const newAssignee = teamMembers.find(m => m.MemberID === newAssigneeId);
        performAction('DECLINE_KIT_DUTY', { userId: currentUser.MemberID, userName: currentUser.Name, newAssigneeId, newAssigneeName: newAssignee?.Name, matchDate }, `You have declined kit duty. It has been reassigned to ${newAssignee?.Name}.`);
    };

    const handleCheckIn = (matchDate: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match || !currentUser) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // We send coordinates to the backend for verification
                performAction('CHECK_IN', { 
                    userId: currentUser.MemberID, 
                    matchDate, 
                    coords: { lat: latitude, lng: longitude } 
                }).then(result => {
                    if (result.success) {
                        alert(result.message);
                    } else {
                        alert(`Check-in failed: ${result.message}`);
                    }
                });
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Please ensure location services are enabled and permissions are granted.");
            }
        );
    };

     const handleNotifyNextPlayer = (matchDate: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match) return;

        const assigneeId = match.KitResponsible || match.ProvisionalAssignee;
        const assignee = teamMembers.find(m => m.MemberID === assigneeId);
        if (!assignee) {
            alert('No player assigned for this match.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const isMatchDay = match.Date === today && match.Status === KitStatus.Upcoming;

        let directMessage = '';
        let groupMessage = '';

        if (match.Reason === AssignmentReason.Reassigned) {
             const originalAssignee = teamMembers.find(m => m.MemberID === match.ProvisionalAssignee);
             const originalAssigneeName = originalAssignee?.Name || 'the scheduled player';
             directMessage = `Hi ${assignee.Name}, thanks for your understanding and picking the kit on behalf of ${originalAssigneeName}.`;
             groupMessage = `Kit Duty Update: ${assignee.Name} will be taking the kit for the match on ${formatDate(match.Date)} on behalf of ${originalAssigneeName}.`;
        } else if (match.Reason === AssignmentReason.PenaltyLate) {
            directMessage = `Hi ${assignee.Name}, as per the late arrival rule, you have been assigned kit duty for the match on ${formatDate(match.Date)}. Make sure to be on time next match! :) Thanks!`;
            groupMessage = `Penalty Assignment: ${assignee.Name} has been assigned kit duty for the match on ${formatDate(match.Date)} due to late arrival.`;
        } else if (isMatchDay) {
            directMessage = `Hi ${assignee.Name}, this is a friendly reminder that you are on kit duty for today's match. Please remember to bring your car. Thanks!`;
            groupMessage = `Reminder: ${assignee.Name} is on kit duty for today's match.`;
        } else {
            directMessage = `Hi ${assignee.Name}, this is a friendly reminder that you are on kit duty for the match on ${formatDate(match.Date)}.`;
            groupMessage = `Reminder: ${assignee.Name} is on kit duty for the upcoming match on ${formatDate(match.Date)}.`;
        }
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(groupMessage).then(() => {
                setNotificationInfo({ assignee, match, groupMessage, directMessage });
            }).catch(err => {
                console.error('Could not copy text: ', err);
                alert(`Could not copy group message, but the direct message will still open.`);
                const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace(/\+/g, '')}?text=${encodeURIComponent(directMessage)}`;
                window.open(whatsappUrl, '_blank');
            });
        } else {
            alert(`A direct message to ${assignee.Name} will now open. (Clipboard not supported for group message).`);
            const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace(/\+/g, '')}?text=${encodeURIComponent(directMessage)}`;
            window.open(whatsappUrl, '_blank');
        }
    };
    
    // ADMIN ACTIONS - All actions are now wrappers around performAction
    const addTeamMember = (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => performAction('ADD_TEAM_MEMBER', { memberData });
    const updateTeamMember = (member: TeamMember) => performAction('UPDATE_TEAM_MEMBER', { member });
    const deleteTeamMember = (memberId: string) => performAction('DELETE_TEAM_MEMBER', { memberId });
    const addMatch = (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => performAction('ADD_MATCH', { matchData });
    const updateMatch = (match: KitTrackerEntry) => performAction('UPDATE_MATCH', { match });
    const deleteMatch = (date: string) => performAction('DELETE_MATCH', { date });
    const addBulkTeamMembers = async (data: any[]) => {
        const result = await performAction('BULK_ADD_MEMBERS', { data });
        alert(`Upload complete!\n\n${result.added} records added.\n${result.skipped} records skipped (duplicates or errors).`);
        return result;
    };
    const addBulkMatches = async (data: any[]) => {
        const result = await performAction('BULK_ADD_MATCHES', { data });
        alert(`Upload complete!\n\n${result.added} records added.\n${result.skipped} records skipped (duplicates or errors).`);
        return result;
    };
    const assignPlayerToMatch = (memberId: string, matchDate: string) => performAction('ASSIGN_PLAYER_TO_MATCH', { memberId, matchDate });
    const confirmMatchStatus = (matchDate: string, newStatus: KitStatus.Upcoming | KitStatus.NoPlay) => performAction('CONFIRM_MATCH_STATUS', { matchDate, newStatus });
    const reassignKit = (matchDate: string, newMemberId: string) => performAction('REASSIGN_KIT', { matchDate, newMemberId });
    const applyLatePenalty = (matchDate: string, penalizedMemberId: string) => performAction('APPLY_LATE_PENALTY', { matchDate, penalizedMemberId });
    const confirmHandover = (matchDate: string) => performAction('CONFIRM_HANDOVER', { matchDate }, 'Kit handover confirmed and match completed!');

    const userActions = { confirmKitDuty: handleConfirmKitDuty, declineKitDuty: handleDeclineKitDuty, checkIn: handleCheckIn, notifyNextPlayer: handleNotifyNextPlayer };
    const adminActions = { addTeamMember, updateTeamMember, deleteTeamMember, addMatch, updateMatch, deleteMatch, addBulkTeamMembers, addBulkMatches, assignPlayerToMatch, confirmMatchStatus, applyLatePenalty, reassignKit, confirmHandover, notifyNextPlayer: handleNotifyNextPlayer };

    if (!isDataLoaded) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const renderPage = () => {
        if (currentPage === 'public') {
            return <PublicDashboard 
                teamMembers={teamMembers} 
                kitTracker={kitTracker} 
                onNavigateToLogin={() => {
                    setCurrentPage('login');
                    window.history.pushState({}, '', '/');
                }}
            />;
        }

        if (!currentUser) {
            return <LoginPage 
                onLogin={handleLogin}
                onShowSignUp={() => setShowSignUp(true)}
                onShowForgotPassword={() => setShowForgotPassword(true)}
                onShowPublicView={() => {
                    setCurrentPage('public');
                    window.history.pushState({}, '', '/public');
                }}
            />;
        }

        if (currentPage === 'profile') {
            return (
                 <DashboardShell currentUser={currentUser} onLogout={handleLogout} onNavigateToProfile={() => setCurrentPage('profile')}>
                    <UserProfile
                        currentUser={currentUser}
                        onUpdateProfile={handleUpdateProfile}
                        onChangePassword={handleChangePassword}
                        onBack={() => setCurrentPage('dashboard')}
                    />
                 </DashboardShell>
            );
        }

        return (
            <DashboardShell currentUser={currentUser} onLogout={handleLogout} onNavigateToProfile={() => setCurrentPage('profile')}>
                {currentUser.IsAdmin ? (
                    <AdminPanel teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={adminActions} />
                ) : (
                    <UserPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={userActions} />
                )}
            </DashboardShell>
        );
    };

    return (
        <>
            {renderPage()}
            {showSignUp && <SignUpModal onSignUp={handleSignUp} onClose={() => setShowSignUp(false)} />}
            {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
            {notificationInfo && (
                <NotificationModal 
                    assignee={notificationInfo.assignee}
                    groupMessage={notificationInfo.groupMessage}
                    directMessage={notificationInfo.directMessage}
                    onClose={() => setNotificationInfo(null)}
                />
            )}
        </>
    );
};

export default App;
