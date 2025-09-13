import React, { useState, useEffect } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus } from './types';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER, INITIAL_ARRIVALS } from './constants';
import { getDistanceInMeters } from './utils/helpers';
import LoginPage from './components/LoginPage';
import DashboardShell from './components/DashboardShell';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import SignUpModal, { NewUserData } from './components/SignUpModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';

type AppView = 'DASHBOARD' | 'PROFILE';
type ModalView = 'NONE' | 'SIGNUP' | 'FORGOT_PASSWORD';

const App: React.FC = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        const saved = localStorage.getItem('teamMembers');
        return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
    });
    const [kitTracker, setKitTracker] = useState<KitTrackerEntry[]>(() => {
        const saved = localStorage.getItem('kitTracker');
        return saved ? JSON.parse(saved) : INITIAL_KIT_TRACKER;
    });
    const [arrivals, setArrivals] = useState<Arrival[]>(() => {
        const saved = localStorage.getItem('arrivals');
        return saved ? JSON.parse(saved) : INITIAL_ARRIVALS;
    });
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });
    const [appView, setAppView] = useState<AppView>('DASHBOARD');
    const [modalView, setModalView] = useState<ModalView>('NONE');

    useEffect(() => { localStorage.setItem('teamMembers', JSON.stringify(teamMembers)); }, [teamMembers]);
    useEffect(() => { localStorage.setItem('kitTracker', JSON.stringify(kitTracker)); }, [kitTracker]);
    useEffect(() => { localStorage.setItem('arrivals', JSON.stringify(arrivals)); }, [arrivals]);
    useEffect(() => { 
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

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
        setAppView('DASHBOARD');
    };

    const handleResetData = () => {
        if (window.confirm("Are you sure you want to reset all application data to its initial state? This cannot be undone.")) {
            localStorage.clear();
            setTeamMembers(INITIAL_TEAM_MEMBERS);
            setKitTracker(INITIAL_KIT_TRACKER);
            setArrivals(INITIAL_ARRIVALS);
            setCurrentUser(null);
            alert("Application data has been reset.");
        }
    };

    const handleUpdateProfile = (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser);
        setTeamMembers(prev => prev.map(m => m.MemberID === currentUser.MemberID ? updatedUser : m));
        setAppView('DASHBOARD');
        alert("Profile updated successfully!");
    };
    
    // Actions for panels
    const actions = {
        confirmKitDuty: (matchDate: string) => {
             if (!currentUser) return;
             setKitTracker(prev => prev.map(k => k.Date === matchDate ? {...k, KitResponsible: currentUser.MemberID} : k));
        },
        declineKitDuty: (matchDate: string) => {
            if (!currentUser) return;
            // Simple logic: reassign to next in line. A more complex app would have more logic here.
            alert("You have declined. An admin will be notified to re-assign.");
            // In a real app, this might trigger a notification or a state change.
            // For now, we do nothing to the data.
        },
        takeOnBehalf: (matchDate: string, memberId: string) => {
            setKitTracker(prev => prev.map(k => k.Date === matchDate ? {...k, KitResponsible: memberId, TakenOnBehalfOf: k.ProvisionalAssignee} : k));
        },
        checkIn: (matchDate: string) => {
            if(!currentUser) return;
            const match = kitTracker.find(k => k.Date === matchDate);
            if (!match) return;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const distance = getDistanceInMeters(latitude, longitude, match.GroundLatLong.lat, match.GroundLatLong.lng);
                    if (distance > match.GeoRadiusMeters) {
                        alert(`Check-in failed: You are ${Math.round(distance)} meters away from the ground. You must be within ${match.GeoRadiusMeters} meters.`);
                        return;
                    }
                    
                    const now = new Date();
                    setArrivals(prev => prev.map(a => 
                        a.MatchDate === matchDate && a.Member === currentUser.MemberID 
                        ? { ...a, ArrivalTime: now.toISOString(), CheckInLatLong: { lat: latitude, lng: longitude } }
                        : a
                    ));
                    alert("Checked in successfully!");
                },
                (error) => {
                    alert(`Could not get your location: ${error.message}. Please enable location services.`);
                }
            );
        },
        notifyNextPlayer: () => {
             const upcomingMatch = kitTracker.find(k => k.Status === KitStatus.Upcoming);
             if (!upcomingMatch) {
                 alert("No upcoming match to notify for.");
                 return;
             }
             const assignee = teamMembers.find(m => m.MemberID === upcomingMatch.ProvisionalAssignee);
             if (assignee) {
                 const message = `Hi ${assignee.Name}, this is a reminder that you are provisionally assigned for kit duty for the match on ${upcomingMatch.Date}. Please log in to the app to confirm or decline.`;
                 const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
                 window.open(whatsappUrl, '_blank');
             } else {
                 alert("Could not find the assigned player.");
             }
        },
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => {
            const newMember: TeamMember = {
                ...memberData,
                MemberID: `user${Date.now()}`,
                CompletedInRound: false
            };
            setTeamMembers(prev => [...prev, newMember]);
        },
        updateTeamMember: (member: TeamMember) => {
            setTeamMembers(prev => prev.map(m => m.MemberID === member.MemberID ? member : m));
        },
        deleteTeamMember: (memberId: string) => {
            setTeamMembers(prev => prev.filter(m => m.MemberID !== memberId));
        },
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn'>) => {
            // Very simple logic to assign to next eligible player
            const eligiblePlayers = teamMembers.filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active).sort((a,b) => a.Order - b.Order);
            const lastCompletedPlayer = teamMembers.find(m => m.CompletedInRound);
            let nextPlayer = eligiblePlayers[0];
            if (lastCompletedPlayer) {
                const lastIndex = eligiblePlayers.findIndex(p => p.MemberID === lastCompletedPlayer.MemberID);
                nextPlayer = eligiblePlayers[(lastIndex + 1) % eligiblePlayers.length];
            }

            const newMatch: KitTrackerEntry = {
                ...matchData,
                ProvisionalAssignee: nextPlayer.MemberID,
                KitResponsible: '',
                TakenOnBehalfOf: '',
                Status: KitStatus.Upcoming,
                WeeksHeld: 0,
                MatchOn: false
            };
            setKitTracker(prev => [...prev, newMatch]);
        },
        updateMatch: (match: KitTrackerEntry) => {
            setKitTracker(prev => prev.map(k => k.Date === match.Date ? match : k));
        },
        deleteMatch: (date: string) => {
            setKitTracker(prev => prev.filter(k => k.Date !== date));
        },
        addBulkTeamMembers: (data: any[]) => {
            let added = 0;
            let skipped = 0;
            const newMembers: TeamMember[] = [];
            data.forEach(row => {
                if (!row.username || teamMembers.some(m => m.username === row.username)) {
                    skipped++;
                    return;
                }
                newMembers.push({
                    MemberID: `user_csv_${Date.now()}_${Math.random()}`,
                    Name: row.Name,
                    username: row.username,
                    password: row.password,
                    Role: row.Role || 'Player',
                    IsAdmin: row.IsAdmin?.toLowerCase() === 'true',
                    PhoneNumber: row.PhoneNumber,
                    OwnsCar: row.OwnsCar?.toLowerCase() === 'true',
                    Status: (Object.values(MemberStatus) as string[]).includes(row.Status) ? row.Status as MemberStatus : MemberStatus.Active,
                    RotationEligible: row.RotationEligible === "Yes" ? "Yes" : "No",
                    PenaltyEligible: row.PenaltyEligible?.toLowerCase() === 'true',
                    Order: parseInt(row.Order, 10) || 100,
                    CompletedInRound: false,
                    Notes: row.Notes
                });
                added++;
            });
            setTeamMembers(prev => [...prev, ...newMembers]);
            return { added, skipped };
        },
        addBulkMatches: (data: any[]) => {
             let added = 0;
             let skipped = 0;
             // This is simplified. Proper logic for assigning users would be needed.
             // For now, we just add them without assigning anyone.
             const newMatches: KitTrackerEntry[] = [];
             data.forEach(row => {
                if (!row.Date || kitTracker.some(m => m.Date === row.Date)) {
                    skipped++;
                    return;
                }
                 newMatches.push({
                    Date: row.Date,
                    DueDate: row.DueDate || row.Date,
                    GroundLatLong: { lat: parseFloat(row.Lat) || 0, lng: parseFloat(row.Lng) || 0 },
                    GeoRadiusMeters: parseInt(row.GeoRadiusMeters, 10) || 250,
                    CutoffTime: row.CutoffTime || '22:45',
                    ProvisionalAssignee: '', // Left blank for bulk, admin can assign later
                    KitResponsible: '',
                    TakenOnBehalfOf: '',
                    Status: KitStatus.Upcoming,
                    WeeksHeld: 0,
                    Notes: row.Notes || '',
                    MatchOn: false,
                });
                added++;
             });
             setKitTracker(prev => [...prev, ...newMatches]);
             return { added, skipped };
        }
    };

    const handleSignUp = (userData: NewUserData): boolean => {
        if(teamMembers.some(m => m.username.toLowerCase() === userData.username.toLowerCase())) {
            return false;
        }

        const newMember: TeamMember = {
            MemberID: `user_${Date.now()}`,
            Name: userData.Name,
            username: userData.username,
            password: userData.password,
            PhoneNumber: userData.PhoneNumber,
            Role: 'Player',
            IsAdmin: false,
            OwnsCar: false,
            Status: MemberStatus.Active,
            RotationEligible: 'Yes',
            PenaltyEligible: true,
            Order: Math.max(...teamMembers.map(m => m.Order), 0) + 1,
            CompletedInRound: false,
            Notes: 'New user signup'
        };
        setTeamMembers(prev => [...prev, newMember]);
        alert('Sign up successful! Please log in with your new credentials.');
        setModalView('NONE');
        return true;
    }


    if (!currentUser) {
        return (
            <>
                <LoginPage 
                    onLogin={handleLogin}
                    onShowSignUp={() => setModalView('SIGNUP')}
                    onShowForgotPassword={() => setModalView('FORGOT_PASSWORD')}
                    onResetData={handleResetData} 
                />
                {modalView === 'SIGNUP' && <SignUpModal onSignUp={handleSignUp} onClose={() => setModalView('NONE')} />}
                {modalView === 'FORGOT_PASSWORD' && <ForgotPasswordModal teamMembers={teamMembers} onClose={() => setModalView('NONE')} />}
            </>
        );
    }

    return (
        <DashboardShell
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToProfile={() => setAppView('PROFILE')}
        >
            {appView === 'DASHBOARD' && (
                currentUser.IsAdmin 
                ? <AdminPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={actions} />
                : <UserPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={actions} />
            )}
            {appView === 'PROFILE' && (
                <UserProfile 
                    currentUser={currentUser} 
                    onUpdateProfile={handleUpdateProfile}
                    onBack={() => setAppView('DASHBOARD')}
                />
            )}
        </DashboardShell>
    );
};

export default App;
