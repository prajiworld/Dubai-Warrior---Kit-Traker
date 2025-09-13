import React, { useState, useEffect, useCallback } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus, AssignmentReason } from './types';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER, INITIAL_ARRIVALS } from './constants';
import LoginPage from './components/LoginPage';
import DashboardShell from './components/DashboardShell';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import SignUpModal, { type NewUserData } from './components/SignUpModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import { getDistanceInMeters, formatDate } from './utils/helpers';

const App: React.FC = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [kitTracker, setKitTracker] = useState<KitTrackerEntry[]>([]);
    const [arrivals, setArrivals] = useState<Arrival[]>([]);
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [showSignUp, setShowSignUp] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const loadData = useCallback(() => {
        try {
            const storedMembers = localStorage.getItem('kit-tracker-team');
            const storedKit = localStorage.getItem('kit-tracker-matches');
            const storedArrivals = localStorage.getItem('kit-tracker-arrivals');

            setTeamMembers(storedMembers ? JSON.parse(storedMembers) : INITIAL_TEAM_MEMBERS);
            setKitTracker(storedKit ? JSON.parse(storedKit) : INITIAL_KIT_TRACKER);
            setArrivals(storedArrivals ? JSON.parse(storedArrivals) : INITIAL_ARRIVALS);
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            setTeamMembers(INITIAL_TEAM_MEMBERS);
            setKitTracker(INITIAL_KIT_TRACKER);
            setArrivals(INITIAL_ARRIVALS);
        }
        setIsDataLoaded(true);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (isDataLoaded) {
            try {
                localStorage.setItem('kit-tracker-team', JSON.stringify(teamMembers));
                localStorage.setItem('kit-tracker-matches', JSON.stringify(kitTracker));
                localStorage.setItem('kit-tracker-arrivals', JSON.stringify(arrivals));
            } catch (error) {
                console.error("Failed to save data to localStorage", error);
            }
        }
    }, [teamMembers, kitTracker, arrivals, isDataLoaded]);
    
    // AUTHENTICATION
    const handleLogin = (username: string, password: string): boolean => {
        const user = teamMembers.find(m => m.username.toLowerCase() === username.toLowerCase() && m.password === password);
        if (user) {
            setCurrentUser(user);
            setCurrentPage('dashboard');
            return true;
        }
        return false;
    };
    const handleLogout = () => setCurrentUser(null);
    const handleResetData = () => {
        if (window.confirm("Are you sure you want to reset all application data to its initial state? This cannot be undone.")) {
            localStorage.clear();
            loadData();
            setCurrentUser(null);
            alert("Application data has been reset.");
        }
    };

    const handleSignUp = (userData: NewUserData): boolean => {
        if (teamMembers.some(m => m.username.toLowerCase() === userData.username.toLowerCase())) {
            return false;
        }
        const maxOrder = Math.max(...teamMembers.map(m => m.Order), 0);
        const newUser: TeamMember = {
            ...userData,
            MemberID: `user${Date.now()}`,
            Role: 'Player',
            IsAdmin: false,
            OwnsCar: false,
            Status: MemberStatus.Active,
            RotationEligible: 'No',
            PenaltyEligible: true,
            Order: maxOrder + 1,
            CompletedInRound: false,
            Notes: 'New user',
        };
        setTeamMembers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        setCurrentPage('dashboard');
        setShowSignUp(false);
        return true;
    };
    
    // USER ACTIONS
    const handleUpdateProfile = (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser);
        setTeamMembers(prev => prev.map(m => m.MemberID === currentUser.MemberID ? updatedUser : m));
        alert('Profile updated!');
        setCurrentPage('dashboard');
    };
    
    // FIX: Implement confirmKitDuty to resolve type error.
    const handleConfirmKitDuty = (matchDate: string) => {
        if (!currentUser) return;
        setKitTracker(prev => prev.map(k => 
            k.Date === matchDate && k.ProvisionalAssignee === currentUser.MemberID 
                ? { ...k, KitResponsible: currentUser.MemberID } 
                : k
        ));
        alert('You have confirmed kit duty. Thanks for taking responsibility!');
    };

    // FIX: Implement declineKitDuty to resolve type error.
    const handleDeclineKitDuty = (matchDate: string) => {
        if (!currentUser) return;
        setKitTracker(prev => prev.map(k => 
            k.Date === matchDate && k.ProvisionalAssignee === currentUser.MemberID 
                ? { ...k, ProvisionalAssignee: '', Notes: `${k.Notes || ''} ${currentUser.Name} declined duty.`.trim(), Reason: AssignmentReason.Reassigned } 
                : k
        ));
        alert('You have declined kit duty. The admin will be notified to reassign it.');
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
                    const newArrival: Arrival = {
                        ArrivalID: `arr-${currentUser.MemberID}-${matchDate}`,
                        MatchDate: matchDate,
                        Member: currentUser.MemberID,
                        ArrivalTime: now,
                        CheckInLatLong: { lat: latitude, lng: longitude },
                    };
                    setArrivals(prev => [...prev.filter(a => !(a.Member === currentUser.MemberID && a.MatchDate === matchDate)), newArrival]);
                    alert(`Checked in successfully at ${new Date(now).toLocaleTimeString()}`);
                } else {
                    alert(`Check-in failed. You are ${Math.round(distance)} meters away from the ground. Please get closer.`);
                }
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

        let message = '';
        if (match.Reason === AssignmentReason.Reassigned) {
             const originalAssignee = teamMembers.find(m => m.MemberID === match.ProvisionalAssignee);
             message = `Hi ${assignee.Name}, thanks for your understanding and picking the kit on behalf of ${originalAssignee?.Name || 'the scheduled player'}.`;
        } else if (match.Reason === AssignmentReason.PenaltyLate) {
            message = `Hi ${assignee.Name}, as per the late arrival rule, you have been assigned kit duty. Make sure to be on time next match! :) Thanks!`;
        } else if (isMatchDay) {
            message = `Hi ${assignee.Name}, this is a friendly reminder that you are on kit duty for today's match. Please remember to bring your car. Thanks!`;
        } else {
            message = `Hi ${assignee.Name}, this is a friendly reminder that you are on kit duty for the match on ${formatDate(match.Date)}.`;
        }
        
        const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    // ADMIN ACTIONS
    const addTeamMember = (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => {
        const newMember: TeamMember = {
            ...memberData,
            MemberID: `user${Date.now()}`,
            CompletedInRound: false,
        };
        setTeamMembers(prev => [...prev, newMember]);
    };
    const updateTeamMember = (member: TeamMember) => setTeamMembers(prev => prev.map(m => m.MemberID === member.MemberID ? member : m));
    const deleteTeamMember = (memberId: string) => setTeamMembers(prev => prev.filter(m => m.MemberID !== memberId));
    
    const handleAddMatch = (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => {
        const newMatch: KitTrackerEntry = {
            ...matchData,
            ProvisionalAssignee: '', KitResponsible: '', TakenOnBehalfOf: '',
            Status: KitStatus.Scheduled, // New matches start as Scheduled
            WeeksHeld: 0, MatchOn: false,
            Reason: AssignmentReason.Rotation,
        };
        setKitTracker(prev => [...prev, newMatch]);
        const newArrivalsForMatch = teamMembers
            .filter(m => m.Status === MemberStatus.Active)
            .map(m => ({
                ArrivalID: `arr-${m.MemberID}-${newMatch.Date}`,
                MatchDate: newMatch.Date, Member: m.MemberID, ArrivalTime: null, CheckInLatLong: null
            }));
        setArrivals(prev => [...prev, ...newArrivalsForMatch]);
    };
    const updateMatch = (match: KitTrackerEntry) => setKitTracker(prev => prev.map(k => k.Date === match.Date ? match : k));
    const deleteMatch = (date: string) => {
        setKitTracker(prev => prev.filter(k => k.Date !== date));
        setArrivals(prev => prev.filter(a => a.MatchDate !== date));
    };

    const addBulkTeamMembers = (data: any[]): { added: number, skipped: number } => {
        let added = 0, skipped = 0;
        const newMembers: TeamMember[] = [];
        data.forEach(item => {
            if (!item.username || teamMembers.some(m => m.username === item.username)) {
                skipped++;
                return;
            }
            newMembers.push({
                MemberID: `user-csv-${item.username}-${Date.now()}`,
                Name: item.Name, username: item.username, password: item.password,
                Role: item.Role || 'Player', IsAdmin: item.IsAdmin === 'TRUE',
                PhoneNumber: item.PhoneNumber, OwnsCar: item.OwnsCar === 'TRUE',
                Status: (Object.values(MemberStatus).includes(item.Status) ? item.Status : MemberStatus.Active) as MemberStatus,
                RotationEligible: item.RotationEligible === 'No' ? 'No' : 'Yes',
                PenaltyEligible: item.PenaltyEligible !== 'FALSE', Order: parseInt(item.Order, 10) || 100,
                CompletedInRound: false, Notes: item.Notes,
            });
            added++;
        });
        setTeamMembers(prev => [...prev, ...newMembers]);
        return { added, skipped };
    };

    const addBulkMatches = (data: any[]): { added: number, skipped: number } => {
         let added = 0, skipped = 0;
         const newMatches: KitTrackerEntry[] = [];
         const newArrivals: Arrival[] = [];
         data.forEach(item => {
            if (!item.Date || kitTracker.some(k => k.Date === item.Date)) {
                skipped++;
                return;
            }
            const newMatch: KitTrackerEntry = {
                Date: item.Date, DueDate: item.DueDate,
                GroundLatLong: { lat: parseFloat(item.Lat), lng: parseFloat(item.Lng) },
                GeoRadiusMeters: parseInt(item.GeoRadiusMeters, 10),
                CutoffTime: item.CutoffTime, Notes: item.Notes,
                ProvisionalAssignee: '', KitResponsible: '', TakenOnBehalfOf: '',
                Status: KitStatus.Scheduled, WeeksHeld: 0, MatchOn: false,
                Reason: AssignmentReason.Rotation,
            };
            newMatches.push(newMatch);
            teamMembers.forEach(m => newArrivals.push({
                ArrivalID: `arr-${m.MemberID}-${newMatch.Date}`,
                MatchDate: newMatch.Date, Member: m.MemberID, ArrivalTime: null, CheckInLatLong: null
            }));
            added++;
         });
         setKitTracker(prev => [...prev, ...newMatches]);
         setArrivals(prev => [...prev, ...newArrivals]);
         return { added, skipped };
    };

    const handleAssignPlayerToMatch = (memberId: string, matchDate: string) => {
        setKitTracker(prev => {
            const newState = prev.map(match => {
                // If this is the match we are assigning to, set the new assignee
                if (match.Date === matchDate) {
                    return { ...match, ProvisionalAssignee: memberId, Reason: AssignmentReason.Rotation };
                }
                // If another match was previously assigned to this player, unassign it
                if (match.ProvisionalAssignee === memberId) {
                    return { ...match, ProvisionalAssignee: '', Reason: AssignmentReason.Rotation };
                }
                return match;
            });
            return newState;
        });
    };

    const handleConfirmMatchStatus = (matchDate: string, newStatus: KitStatus.Upcoming | KitStatus.NoPlay) => {
        setKitTracker(prev => prev.map(k => k.Date === matchDate ? { ...k, Status: newStatus, MatchOn: newStatus === KitStatus.Upcoming } : k));
    };
    
    const handleReassignKit = (matchDate: string, newMemberId: string) => {
        setKitTracker(prev => prev.map(k => k.Date === matchDate ? { ...k, KitResponsible: newMemberId, Reason: AssignmentReason.Reassigned } : k));
    };

    const handleApplyLatePenalty = (matchDate: string, penalizedMemberId: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match) return;

        const originalAssigneeId = match.ProvisionalAssignee;

        setKitTracker(prev => {
            const nextWeek = new Date(match.Date);
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];

            let nextWeekMatchExists = prev.some(k => k.Date === nextWeekStr);

            const updatedTracker = prev.map(k => {
                // Apply penalty to current match
                if (k.Date === matchDate) {
                    return {
                        ...k,
                        KitResponsible: penalizedMemberId,
                        Reason: AssignmentReason.PenaltyLate,
                        DeferredMemberID: originalAssigneeId
                    };
                }
                // Defer original assignee to next week's match
                if (k.Date === nextWeekStr) {
                    return {
                        ...k,
                        ProvisionalAssignee: originalAssigneeId,
                        Reason: AssignmentReason.Deferred
                    };
                }
                return k;
            });
            
            // If next week's match doesn't exist, create it for the deferred player
            if (!nextWeekMatchExists && originalAssigneeId) {
                const newMatch: KitTrackerEntry = {
                    ...match,
                    Date: nextWeekStr,
                    DueDate: nextWeekStr,
                    Status: KitStatus.Scheduled,
                    ProvisionalAssignee: originalAssigneeId,
                    KitResponsible: '',
                    TakenOnBehalfOf: '',
                    WeeksHeld: 0,
                    Reason: AssignmentReason.Deferred,
                    DeferredMemberID: undefined,
                    Notes: `Deferred from ${match.Date}`,
                };
                updatedTracker.push(newMatch);
                 // Also add arrivals for this new match
                const newArrivalsForMatch = teamMembers
                    .filter(m => m.Status === MemberStatus.Active)
                    .map(m => ({
                        ArrivalID: `arr-${m.MemberID}-${newMatch.Date}`,
                        MatchDate: newMatch.Date, Member: m.MemberID, ArrivalTime: null, CheckInLatLong: null
                    }));
                setArrivals(currentArrivals => [...currentArrivals, ...newArrivalsForMatch]);
            }
            
            return updatedTracker;
        });
    };
    
    const handleConfirmHandover = (matchDate: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match) return;
        const carrierId = match.KitResponsible || match.ProvisionalAssignee;
        if (!carrierId) {
            alert("Cannot confirm handover. No kit carrier is assigned.");
            return;
        }

        // Update Kit Tracker: set status to Completed and calculate WeeksHeld
        setKitTracker(prev => {
            const previousMatches = prev
                .filter(k => new Date(k.Date) < new Date(matchDate) && k.Status === KitStatus.Completed)
                .sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
            
            const lastMatch = previousMatches[0];
            let weeksHeld = 1;
            if (lastMatch && lastMatch.KitResponsible === carrierId) {
                weeksHeld = (lastMatch.WeeksHeld || 0) + 1;
            }

            return prev.map(k => k.Date === matchDate ? { ...k, Status: KitStatus.Completed, KitResponsible: carrierId, WeeksHeld: weeksHeld } : k);
        });

        // Update Team Member: set CompletedInRound to true, but only if it's not a penalty
        setTeamMembers(prev => {
            // If the reason was a penalty or reassignment, do not update rotation status.
            if (match.Reason === AssignmentReason.PenaltyLate || match.Reason === AssignmentReason.Reassigned) {
                return prev;
            }

            const updatedMembers = prev.map(m => m.MemberID === carrierId ? { ...m, CompletedInRound: true } : m);

            // Check if round is complete
            const activeRotationMembers = updatedMembers.filter(m => m.Status === MemberStatus.Active && m.RotationEligible === 'Yes');
            const allCompleted = activeRotationMembers.every(m => m.CompletedInRound);

            if (allCompleted && activeRotationMembers.length > 0) {
                alert("This completes the rotation round! Resetting for the next round.");
                return updatedMembers.map(m => ({...m, CompletedInRound: false }));
            }
            return updatedMembers;
        });
    };

    const adminActions = {
        addTeamMember, updateTeamMember, deleteTeamMember,
        addMatch: handleAddMatch, updateMatch, deleteMatch,
        addBulkTeamMembers, addBulkMatches,
        assignPlayerToMatch: handleAssignPlayerToMatch,
        confirmMatchStatus: handleConfirmMatchStatus,
        applyLatePenalty: handleApplyLatePenalty,
        reassignKit: handleReassignKit,
        confirmHandover: handleConfirmHandover,
        // FIX: Add missing 'notifyNextPlayer' to adminActions to resolve type error.
        notifyNextPlayer: handleNotifyNextPlayer,
    };
    
    // FIX: Add missing 'confirmKitDuty' and 'declineKitDuty' to userActions to resolve type error.
    const userActions = {
        confirmKitDuty: handleConfirmKitDuty,
        declineKitDuty: handleDeclineKitDuty,
        checkIn: handleCheckIn,
        notifyNextPlayer: handleNotifyNextPlayer,
    };
    
    if (!isDataLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-white">Loading application...</p></div>;

    if (!currentUser) {
        return (
            <>
                <LoginPage onLogin={handleLogin} onResetData={handleResetData} onShowSignUp={() => setShowSignUp(true)} onShowForgotPassword={() => setShowForgotPassword(true)} />
                {showSignUp && <SignUpModal onSignUp={handleSignUp} onClose={() => setShowSignUp(false)} />}
                {showForgotPassword && <ForgotPasswordModal teamMembers={teamMembers} onClose={() => setShowForgotPassword(false)} />}
            </>
        );
    }
    
    const pageContent = () => {
        if (currentPage === 'profile') {
            return <UserProfile currentUser={currentUser} onUpdateProfile={handleUpdateProfile} onBack={() => setCurrentPage('dashboard')} />;
        }
        if (currentPage === 'dashboard') {
            return currentUser.IsAdmin
                ? <AdminPanel teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={{...adminActions, notifyNextPlayer: handleNotifyNextPlayer}} />
                : <UserPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={userActions} />;
        }
        return null;
    };

    return (
        <DashboardShell currentUser={currentUser} onLogout={handleLogout} onNavigateToProfile={() => setCurrentPage('profile')}>
            {pageContent()}
        </DashboardShell>
    );
};

export default App;