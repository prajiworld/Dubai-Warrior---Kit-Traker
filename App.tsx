import React, { useState, useEffect } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus, AssignmentReason } from './types';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER, INITIAL_ARRIVALS } from './constants';
import LoginPage from './components/LoginPage';
import SignUpModal, { NewUserData } from './components/SignUpModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import DashboardShell from './components/DashboardShell';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import { getDistanceInMeters } from './utils/helpers';


// Custom hook for localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
}


const App: React.FC = () => {
    // App State
    const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>('teamMembers', INITIAL_TEAM_MEMBERS);
    const [kitTracker, setKitTracker] = useLocalStorage<KitTrackerEntry[]>('kitTracker', INITIAL_KIT_TRACKER);
    const [arrivals, setArrivals] = useLocalStorage<Arrival[]>('arrivals', INITIAL_ARRIVALS);
    const [currentUser, setCurrentUser] = useLocalStorage<TeamMember | null>('currentUser', null);
    
    // UI State
    const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
    const [showSignUp, setShowSignUp] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Effect to update match statuses based on dates (pseudo-cron job)
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setKitTracker(prev => prev.map(match => {
            if (match.Status === KitStatus.Upcoming && match.Date < today) {
                // If match passed and no one was responsible, mark as missed. Otherwise complete.
                return { ...match, Status: match.KitResponsible ? KitStatus.Completed : KitStatus.Missed };
            }
            return match;
        }));
    }, []);


    // --- Authentication Actions ---
    const handleLogin = (username: string, password: string): boolean => {
        const user = teamMembers.find(m => m.username.toLowerCase() === username.toLowerCase() && m.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('dashboard');
    };

    const handleResetData = () => {
        if(window.confirm("Are you sure you want to reset all application data to the initial state? This cannot be undone.")) {
            localStorage.clear();
            window.location.reload();
        }
    };
    
    const handleSignUp = (userData: NewUserData): boolean => {
        const usernameExists = teamMembers.some(m => m.username.toLowerCase() === userData.username.toLowerCase());
        if (usernameExists) return false;

        const newMember: TeamMember = {
            ...userData,
            MemberID: `user-${Date.now()}`,
            Role: 'Player',
            IsAdmin: false,
            OwnsCar: false,
            Status: MemberStatus.Active,
            RotationEligible: 'Yes',
            PenaltyEligible: true,
            Order: Math.max(...teamMembers.map(m => m.Order), 0) + 1,
            CompletedInRound: false,
            Notes: 'New user',
        };
        setTeamMembers(prev => [...prev, newMember]);
        // Log in the new user
        setCurrentUser(newMember);
        setShowSignUp(false);
        return true;
    };
    
    const handleUpdateProfile = (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser);
        setTeamMembers(prev => prev.map(m => m.MemberID === updatedUser.MemberID ? updatedUser : m));
        alert("Profile updated successfully!");
        setCurrentView('dashboard');
    };


    // --- User Actions ---
    const handleCheckIn = (matchDate: string) => {
        if (!currentUser) return;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const match = kitTracker.find(k => k.Date === matchDate);
                if (!match) return;

                const distance = getDistanceInMeters(latitude, longitude, match.GroundLatLong.lat, match.GroundLatLong.lng);

                if (distance > match.GeoRadiusMeters) {
                    alert(`Check-in failed. You are ${Math.round(distance)} meters away from the ground. You must be within ${match.GeoRadiusMeters} meters.`);
                    return;
                }

                setArrivals(prev => {
                    const existingArrival = prev.find(a => a.MatchDate === matchDate && a.Member === currentUser.MemberID);
                    if (existingArrival) {
                        return prev.map(a => a.ArrivalID === existingArrival.ArrivalID ? {
                            ...a,
                            ArrivalTime: new Date().toISOString(),
                            CheckInLatLong: { lat: latitude, lng: longitude },
                        } : a);
                    } else {
                        // This case is unlikely if arrivals are pre-created, but good for robustness
                        return [...prev, {
                            ArrivalID: `arr-${Date.now()}`,
                            MatchDate: matchDate,
                            Member: currentUser.MemberID,
                            ArrivalTime: new Date().toISOString(),
                            CheckInLatLong: { lat: latitude, lng: longitude },
                        }];
                    }
                });
                alert("Checked in successfully!");
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Please enable location services and try again.");
            }
        );
    };

    const handleConfirmKitDuty = (matchDate: string) => {
         if (!currentUser) return;
         setKitTracker(prev => prev.map(m => m.Date === matchDate ? { ...m, KitResponsible: currentUser.MemberID } : m));
    };

    const handleDeclineKitDuty = (matchDate: string) => {
        if (!currentUser) return;
        alert("You have declined kit duty. An admin will be notified to reassign it.");
        // In a real app, this would trigger a notification. Here we just log it.
        console.log(`User ${currentUser.Name} declined kit duty for ${matchDate}.`);
    };

    const handleNotifyNextPlayer = (matchDate: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match) return;
        const assigneeId = match.KitResponsible || match.ProvisionalAssignee;
        const assignee = teamMembers.find(m => m.MemberID === assigneeId);
        if (!assignee) {
            alert("Could not find the assigned player.");
            return;
        }
        const message = `Hi ${assignee.Name}, this is a friendly reminder that you are on kit duty for the match on ${match.Date}. Please remember to bring it. Thanks!`;
        const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };


    // --- Admin Actions ---
    const handleAddTeamMember = (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => {
        const newMember: TeamMember = {
            ...memberData,
            MemberID: `user-${Date.now()}`,
            CompletedInRound: false,
        };
        setTeamMembers(prev => [...prev, newMember].sort((a,b) => a.Order - b.Order));
    };

    const handleUpdateTeamMember = (updatedMember: TeamMember) => {
        setTeamMembers(prev => prev.map(m => m.MemberID === updatedMember.MemberID ? updatedMember : m));
    };

    const handleDeleteTeamMember = (memberId: string) => {
        setTeamMembers(prev => prev.filter(m => m.MemberID !== memberId));
    };

    const handleAddMatch = (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => {
        // Logic to determine provisional assignee
        const lastCompletedMatch = kitTracker.filter(k => k.Status === KitStatus.Completed && k.KitResponsible).sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];
        const lastResponsibleMember = teamMembers.find(m => m.MemberID === lastCompletedMatch?.KitResponsible);
        const lastOrder = lastResponsibleMember?.Order || 0;
        
        const eligibleMembers = teamMembers.filter(m => m.Status === MemberStatus.Active && m.RotationEligible === 'Yes').sort((a,b) => a.Order - b.Order);
        let nextAssignee = eligibleMembers.find(m => m.Order > lastOrder);
        if (!nextAssignee && eligibleMembers.length > 0) nextAssignee = eligibleMembers[0];

        const newMatch: KitTrackerEntry = {
            ...matchData,
            ProvisionalAssignee: nextAssignee?.MemberID || '',
            KitResponsible: '',
            TakenOnBehalfOf: '',
            Status: KitStatus.Upcoming,
            WeeksHeld: 0,
            MatchOn: true,
            Reason: AssignmentReason.Rotation,
        };
        setKitTracker(prev => [...prev, newMatch]);
        // Also add arrival stubs for active members
        setArrivals(prev => {
            const newArrivals = teamMembers
                .filter(m => m.Status === MemberStatus.Active)
                .map(m => ({
                    ArrivalID: `arr-${m.MemberID}-${matchData.Date}`,
                    MatchDate: matchData.Date,
                    Member: m.MemberID,
                    ArrivalTime: null,
                    CheckInLatLong: null,
                }));
            return [...prev, ...newArrivals];
        });
    };

    const handleUpdateMatch = (updatedMatch: KitTrackerEntry) => {
        setKitTracker(prev => prev.map(m => m.Date === updatedMatch.Date ? updatedMatch : m));
    };

    const handleDeleteMatch = (date: string) => {
        setKitTracker(prev => prev.filter(m => m.Date !== date));
        setArrivals(prev => prev.filter(a => a.MatchDate !== date));
    };

    const handleApplyLatePenalty = (matchDate: string) => {
        const match = kitTracker.find(k => k.Date === matchDate);
        if (!match) return;

        const lateArrivals = arrivals.filter(a => {
            if (!a.ArrivalTime) return false;
            return new Date(a.ArrivalTime).toTimeString().slice(0, 5) > match.CutoffTime;
        }).sort((a, b) => new Date(b.ArrivalTime!).getTime() - new Date(a.ArrivalTime!).getTime());

        const lastLatecomerId = lateArrivals[0]?.Member;
        if (!lastLatecomerId) {
            alert("No latecomers to penalize.");
            return;
        }

        setKitTracker(prev => prev.map(m => {
            if (m.Date === matchDate) {
                return {
                    ...m,
                    KitResponsible: lastLatecomerId,
                    Reason: AssignmentReason.PenaltyLate,
                };
            }
            return m;
        }));
        alert(`Kit duty assigned to ${teamMembers.find(m => m.MemberID === lastLatecomerId)?.Name} as a penalty.`);
    };

    const handleReassignKit = (matchDate: string, memberId: string) => {
        setKitTracker(prev => prev.map(m => m.Date === matchDate ? {...m, KitResponsible: memberId, Reason: AssignmentReason.Reassigned } : m));
    };


    const handleConfirmHandover = (matchDate: string) => {
        setKitTracker(prev => prev.map(m => m.Date === matchDate ? {...m, Status: KitStatus.Completed } : m));
    };

    const handleBulkUpload = (data: any[], type: 'members' | 'matches'): { added: number, skipped: number } => {
        let added = 0;
        let skipped = 0;

        if (type === 'members') {
            const existingUsernames = new Set(teamMembers.map(m => m.username.toLowerCase()));
            const newMembers: TeamMember[] = [];
            data.forEach((row, index) => {
                if (!row.username || existingUsernames.has(row.username.toLowerCase())) {
                    skipped++;
                    return;
                }
                newMembers.push({
                    MemberID: `user-csv-${Date.now()}-${index}`,
                    Name: row.Name,
                    username: row.username,
                    password: row.password,
                    Role: row.Role || 'Player',
                    IsAdmin: row.IsAdmin?.toLowerCase() === 'true',
                    PhoneNumber: row.PhoneNumber,
                    OwnsCar: row.OwnsCar?.toLowerCase() === 'true',
                    Status: row.Status as MemberStatus || MemberStatus.Active,
                    RotationEligible: row.RotationEligible as "Yes" | "No" || "Yes",
                    PenaltyEligible: row.PenaltyEligible?.toLowerCase() !== 'false',
                    Order: parseInt(row.Order, 10) || 999,
                    CompletedInRound: false,
                    Notes: row.Notes || '',
                });
                added++;
            });
            setTeamMembers(prev => [...prev, ...newMembers]);
        } else { // matches
            const existingDates = new Set(kitTracker.map(k => k.Date));
             data.forEach(row => {
                if (!row.Date || existingDates.has(row.Date)) {
                    skipped++;
                    return;
                }
                 handleAddMatch({
                    Date: row.Date,
                    DueDate: row.DueDate || row.Date,
                    GroundLatLong: { lat: parseFloat(row.Lat), lng: parseFloat(row.Lng) },
                    GeoRadiusMeters: parseInt(row.GeoRadiusMeters, 10),
                    CutoffTime: row.CutoffTime,
                    Notes: row.Notes || '',
                });
                added++;
             });
        }

        return { added, skipped };
    };

    // --- Render Logic ---
    if (!currentUser) {
        return (
            <>
                <LoginPage 
                    onLogin={handleLogin}
                    onShowSignUp={() => setShowSignUp(true)}
                    onShowForgotPassword={() => setShowForgotPassword(true)}
                    onResetData={handleResetData}
                />
                {showSignUp && <SignUpModal onSignUp={handleSignUp} onClose={() => setShowSignUp(false)} />}
                {showForgotPassword && <ForgotPasswordModal teamMembers={teamMembers} onClose={() => setShowForgotPassword(false)} />}
            </>
        );
    }
    
    // Actions object to pass down
    const allActions = {
        // UserPanel
        confirmKitDuty: handleConfirmKitDuty,
        declineKitDuty: handleDeclineKitDuty,
        checkIn: handleCheckIn,
        notifyNextPlayer: handleNotifyNextPlayer,
        // DataManagementPanel
        addTeamMember: handleAddTeamMember,
        updateTeamMember: handleUpdateTeamMember,
        deleteTeamMember: handleDeleteTeamMember,
        addMatch: handleAddMatch,
        updateMatch: handleUpdateMatch,
        deleteMatch: handleDeleteMatch,
        addBulkTeamMembers: (data: any) => handleBulkUpload(data, 'members'),
        addBulkMatches: (data: any) => handleBulkUpload(data, 'matches'),
        // MatchDayControlPanel
        applyLatePenalty: handleApplyLatePenalty,
        reassignKit: handleReassignKit,
        confirmHandover: handleConfirmHandover,
        notifyPlayer: handleNotifyNextPlayer,
    };


    return (
        <DashboardShell 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            onNavigateToProfile={() => setCurrentView('profile')}
        >
            {currentView === 'profile' ? (
                <UserProfile 
                    currentUser={currentUser} 
                    onUpdateProfile={handleUpdateProfile} 
                    onBack={() => setCurrentView('dashboard')}
                />
            ) : currentUser.IsAdmin ? (
                <AdminPanel 
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    kitTracker={kitTracker}
                    arrivals={arrivals}
                    actions={allActions}
                />
            ) : (
                <UserPanel
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    kitTracker={kitTracker}
                    arrivals={arrivals}
                    actions={allActions}
                />
            )}
        </DashboardShell>
    );
}

export default App;
