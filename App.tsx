import React, { useState, useEffect } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus, AssignmentReason } from './types';
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
    const adminActions = {
        confirmKitDuty: (matchDate: string) => {
             if (!currentUser) return;
             setKitTracker(prev => prev.map(k => k.Date === matchDate ? {...k, KitResponsible: currentUser.MemberID} : k));
        },
        declineKitDuty: (matchDate: string) => {
            alert("You have declined. An admin can now re-assign the kit from the Match Day Control panel.");
        },
        takeOnBehalf: (matchDate: string, memberId: string) => {
            setKitTracker(prev => prev.map(k => k.Date === matchDate ? {...k, KitResponsible: memberId, TakenOnBehalfOf: k.ProvisionalAssignee, Reason: AssignmentReason.Reassigned } : k));
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
                    const existingArrival = arrivals.find(a => a.MatchDate === matchDate && a.Member === currentUser.MemberID);
                    if (existingArrival) {
                        setArrivals(prev => prev.map(a => a.ArrivalID === existingArrival.ArrivalID ? { ...a, ArrivalTime: now.toISOString(), CheckInLatLong: { lat: latitude, lng: longitude } } : a));
                    } else {
                        const newArrival: Arrival = { ArrivalID: `arr_${Date.now()}`, MatchDate: matchDate, Member: currentUser.MemberID, ArrivalTime: now.toISOString(), CheckInLatLong: { lat: latitude, lng: longitude } };
                        setArrivals(prev => [...prev, newArrival]);
                    }
                    alert("Checked in successfully!");
                },
                (error) => {
                    alert(`Could not get your location: ${error.message}. Please enable location services.`);
                }
            );
        },
        notifyNextPlayer: (matchDate: string) => {
             const match = kitTracker.find(k => k.Date === matchDate);
             if (!match) { alert("Match not found."); return; }

             const assigneeId = match.KitResponsible || match.ProvisionalAssignee;
             const assignee = teamMembers.find(m => m.MemberID === assigneeId);

             if (assignee) {
                 let message = "";
                 if (match.Reason === AssignmentReason.PenaltyLate) {
                     message = `Hi ${assignee.Name}, as per the late arrival rule, you are assigned to carry the cricket kit today (${match.Date}). Please confirm.`;
                 } else {
                     message = `Hi ${assignee.Name}, this is a reminder that you are scheduled to take the cricket kit today (${match.Date}). Please log in to the app to confirm or decline.`;
                 }
                 const whatsappUrl = `https://wa.me/${assignee.PhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
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
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => {
            const eligiblePlayers = teamMembers.filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active && !m.CompletedInRound).sort((a,b) => a.Order - b.Order);
            const deferredMatch = kitTracker.find(k => k.DeferredMemberID && new Date(k.Date).getTime() < new Date(matchData.Date).getTime());
            
            let nextPlayer = eligiblePlayers[0];
            let reason = AssignmentReason.Rotation;

            if (deferredMatch && deferredMatch.DeferredMemberID) {
                const deferredPlayer = teamMembers.find(p => p.MemberID === deferredMatch.DeferredMemberID);
                if (deferredPlayer && eligiblePlayers.some(p => p.MemberID === deferredPlayer.MemberID)) {
                    nextPlayer = deferredPlayer;
                    reason = AssignmentReason.Deferred;
                }
            }
            
            if (!nextPlayer) {
                alert("No eligible players available for rotation.");
                return;
            }

            const newMatch: KitTrackerEntry = {
                ...matchData,
                ProvisionalAssignee: nextPlayer.MemberID,
                KitResponsible: '',
                TakenOnBehalfOf: '',
                Status: KitStatus.Upcoming,
                WeeksHeld: 1, 
                MatchOn: false,
                Reason: reason,
            };
            setKitTracker(prev => [...prev, newMatch].sort((a,b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()));
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
                if (!row.username || teamMembers.some(m => m.username === row.username)) { skipped++; return; }
                newMembers.push({
                    MemberID: `user_csv_${Date.now()}_${Math.random()}`, Name: row.Name, username: row.username, password: row.password, Role: row.Role || 'Player',
                    IsAdmin: row.IsAdmin?.toLowerCase() === 'true', PhoneNumber: row.PhoneNumber, OwnsCar: row.OwnsCar?.toLowerCase() === 'true',
                    Status: (Object.values(MemberStatus) as string[]).includes(row.Status) ? row.Status as MemberStatus : MemberStatus.Active,
                    RotationEligible: row.RotationEligible === "Yes" ? "Yes" : "No", PenaltyEligible: row.PenaltyEligible?.toLowerCase() === 'true',
                    Order: parseInt(row.Order, 10) || 100, CompletedInRound: false, Notes: row.Notes
                });
                added++;
            });
            setTeamMembers(prev => [...prev, ...newMembers]);
            return { added, skipped };
        },
        addBulkMatches: (data: any[]) => {
             let added = 0, skipped = 0;
             const newMatches: KitTrackerEntry[] = [];
             data.forEach(row => {
                if (!row.Date || kitTracker.some(m => m.Date === row.Date)) { skipped++; return; }
                 newMatches.push({
                    Date: row.Date, DueDate: row.DueDate || row.Date, GroundLatLong: { lat: parseFloat(row.Lat) || 0, lng: parseFloat(row.Lng) || 0 },
                    GeoRadiusMeters: parseInt(row.GeoRadiusMeters, 10) || 250, CutoffTime: row.CutoffTime || '22:45',
                    ProvisionalAssignee: '', KitResponsible: '', TakenOnBehalfOf: '', Status: KitStatus.Upcoming, WeeksHeld: 0,
                    Notes: row.Notes || '', MatchOn: false, Reason: AssignmentReason.Rotation,
                });
                added++;
             });
             setKitTracker(prev => [...prev, ...newMatches]);
             return { added, skipped };
        },
        applyLatePenalty: (matchDate: string) => {
            const match = kitTracker.find(k => k.Date === matchDate);
            if (!match) return;

            const lateArrivals = arrivals.filter(a => {
                if (!a.ArrivalTime || a.MatchDate !== matchDate) return false;
                const arrivalTime = new Date(a.ArrivalTime).toTimeString().slice(0, 5);
                return arrivalTime > match.CutoffTime;
            }).sort((a, b) => new Date(b.ArrivalTime!).getTime() - new Date(a.ArrivalTime!).getTime());

            const lastLatecomer = lateArrivals[0];
            if (!lastLatecomer) { alert("No latecomers found to apply penalty."); return; }

            const originalAssigneeId = match.ProvisionalAssignee;

            setKitTracker(prev => {
                const nextWeekDate = new Date(matchDate);
                nextWeekDate.setDate(nextWeekDate.getDate() + 7);
                const nextWeekDateStr = nextWeekDate.toISOString().split('T')[0];
                
                let nextWeekMatchExists = prev.some(k => k.Date === nextWeekDateStr);
                let updatedTracker = [...prev];

                updatedTracker = updatedTracker.map(k => k.Date === matchDate ? { ...k, KitResponsible: lastLatecomer.Member, Reason: AssignmentReason.PenaltyLate, DeferredMemberID: originalAssigneeId } : k);

                if (nextWeekMatchExists) {
                    updatedTracker = updatedTracker.map(k => k.Date === nextWeekDateStr ? { ...k, ProvisionalAssignee: originalAssigneeId, Reason: AssignmentReason.Deferred } : k);
                } else {
                    const nextMatch: KitTrackerEntry = { ...match, Date: nextWeekDateStr, DueDate: nextWeekDateStr, ProvisionalAssignee: originalAssigneeId, KitResponsible: '', Status: KitStatus.Upcoming, Reason: AssignmentReason.Deferred, WeeksHeld: 0, MatchOn: false, Notes: `Deferred from ${matchDate}` };
                    updatedTracker.push(nextMatch);
                }
                return updatedTracker;
            });
            alert(`${teamMembers.find(m=>m.MemberID === lastLatecomer.Member)?.Name} has been assigned the kit due to late arrival.`);
        },
        reassignKit: (matchDate: string, memberId: string) => {
             setKitTracker(prev => prev.map(k => k.Date === matchDate ? {...k, KitResponsible: memberId, Reason: AssignmentReason.Reassigned } : k));
        },
        confirmHandover: (matchDate: string) => {
            let carrierId = '';
            setKitTracker(prev => {
                const sorted = [...prev].sort((a,b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
                const currentMatchIndex = sorted.findIndex(k => k.Date === matchDate);
                const currentMatch = sorted[currentMatchIndex];
                if (!currentMatch || !currentMatch.KitResponsible) {
                    alert("No one is assigned as Kit Responsible to confirm handover.");
                    return prev;
                }
                carrierId = currentMatch.KitResponsible;

                const previousMatch = sorted[currentMatchIndex - 1];
                let weeksHeld = 1;
                if (previousMatch && previousMatch.KitResponsible === currentMatch.KitResponsible) {
                    weeksHeld = previousMatch.WeeksHeld + 1;
                }
                
                return prev.map(k => k.Date === matchDate ? { ...k, Status: KitStatus.Completed, WeeksHeld: weeksHeld } : k);
            });

            setTimeout(() => {
                if (!carrierId) return;
                let updatedMembers = teamMembers.map(m => m.MemberID === carrierId ? { ...m, CompletedInRound: true } : m);
                
                const eligiblePlayers = updatedMembers.filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active);
                const allCompleted = eligiblePlayers.every(m => m.CompletedInRound);
                
                if (allCompleted) {
                    alert("Round complete! Resetting rotation for all eligible players.");
                    updatedMembers = updatedMembers.map(m => eligiblePlayers.find(p => p.MemberID === m.MemberID) ? { ...m, CompletedInRound: false } : m);
                }
                setTeamMembers(updatedMembers);
                alert("Handover confirmed successfully!");
            }, 100);
        },
        moveMemberUpInRotation: (memberId: string) => {
            setTeamMembers(prev => {
                const members = [...prev];
                const rotationList = members.filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active).sort((a, b) => a.Order - b.Order);
                const memberIndex = rotationList.findIndex(m => m.MemberID === memberId);

                if (memberIndex > 0) {
                    const memberToMove = rotationList[memberIndex];
                    const memberToSwapWith = rotationList[memberIndex - 1];
                    const originalIndexA = members.findIndex(m => m.MemberID === memberToMove.MemberID);
                    const originalIndexB = members.findIndex(m => m.MemberID === memberToSwapWith.MemberID);
                    
                    const tempOrder = members[originalIndexA].Order;
                    members[originalIndexA].Order = members[originalIndexB].Order;
                    members[originalIndexB].Order = tempOrder;
                }
                return members;
            });
        },
        moveMemberDownInRotation: (memberId: string) => {
            setTeamMembers(prev => {
                const members = [...prev];
                const rotationList = members.filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active).sort((a, b) => a.Order - b.Order);
                const memberIndex = rotationList.findIndex(m => m.MemberID === memberId);

                if (memberIndex < rotationList.length - 1) {
                    const memberToMove = rotationList[memberIndex];
                    const memberToSwapWith = rotationList[memberIndex + 1];
                    const originalIndexA = members.findIndex(m => m.MemberID === memberToMove.MemberID);
                    const originalIndexB = members.findIndex(m => m.MemberID === memberToSwapWith.MemberID);

                    const tempOrder = members[originalIndexA].Order;
                    members[originalIndexA].Order = members[originalIndexB].Order;
                    members[originalIndexB].Order = tempOrder;
                }
                return members;
            });
        },
    };

    const handleSignUp = (userData: NewUserData): boolean => {
        if(teamMembers.some(m => m.username.toLowerCase() === userData.username.toLowerCase())) { return false; }
        const newMember: TeamMember = {
            MemberID: `user_${Date.now()}`, Name: userData.Name, username: userData.username, password: userData.password, PhoneNumber: userData.PhoneNumber,
            Role: 'Player', IsAdmin: false, OwnsCar: false, Status: MemberStatus.Active, RotationEligible: 'Yes',
            PenaltyEligible: true, Order: Math.max(...teamMembers.map(m => m.Order), 0) + 1, CompletedInRound: false, Notes: 'New user signup'
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

    const allActions = {
        ...adminActions,
    };

    return (
        <DashboardShell
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToProfile={() => setAppView('PROFILE')}
        >
            {appView === 'DASHBOARD' && (
                currentUser.IsAdmin 
                ? <AdminPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={allActions} />
                : <UserPanel currentUser={currentUser} teamMembers={teamMembers} kitTracker={kitTracker} arrivals={arrivals} actions={allActions} />
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