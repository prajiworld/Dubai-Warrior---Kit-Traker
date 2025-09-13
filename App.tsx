import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus } from './types';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER, INITIAL_ARRIVALS } from './constants';
import DashboardShell from './components/DashboardShell';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import { UsersIcon } from './components/Icons';

// A simple user selector component
const UserSelector: React.FC<{ members: TeamMember[], onSelectUser: (memberId: string) => void }> = ({ members, onSelectUser }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Select Your Profile</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">This identifies you on this device.</p>
                </div>
                <div className="space-y-4">
                    {members.map(member => (
                        <button key={member.MemberID} onClick={() => onSelectUser(member.MemberID)}
                            className="w-full flex items-center justify-between px-4 py-3 text-lg font-medium text-left text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-brand-accent hover:text-white transition-colors duration-200"
                        >
                            <span>{member.Name}</span>
                            {member.IsAdmin && <span className="text-xs font-bold text-yellow-500">ADMIN</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App: React.FC = () => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem('MyMember'));
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
    const [activeTab, setActiveTab] = useState('user');
    const [view, setView] = useState<'dashboard' | 'profile'>('dashboard');

    // Register Service Worker for PWA
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }
    }, []);

    useEffect(() => {
        if (currentUserId) localStorage.setItem('MyMember', currentUserId);
        else localStorage.removeItem('MyMember');
    }, [currentUserId]);

    useEffect(() => {
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }, [teamMembers]);

    useEffect(() => {
        localStorage.setItem('kitTracker', JSON.stringify(kitTracker));
    }, [kitTracker]);

    useEffect(() => {
        localStorage.setItem('arrivals', JSON.stringify(arrivals));
    }, [arrivals]);

    const currentUser = useMemo(() => teamMembers.find(m => m.MemberID === currentUserId), [currentUserId, teamMembers]);
    
    const handleSelectUser = (memberId: string) => {
        setCurrentUserId(memberId);
        setView('dashboard');
    };

    const handleLogout = () => {
        setCurrentUserId(null);
        setView('dashboard');
    };
    
    // --- USER PROFILE ACTION ---
    const handleUpdateUserProfile = useCallback((updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => {
        setTeamMembers(prev => prev.map(member => 
            member.MemberID === currentUserId 
                ? { ...member, ...updatedData } 
                : member
        ));
        alert("Profile updated successfully!");
        setView('dashboard');
    }, [currentUserId]);
    
    // --- USER ACTIONS ---
    const handleCheckIn = useCallback((arrivalId: string, location: { lat: number, lng: number }) => {
        setArrivals(prev => prev.map(a => a.ArrivalID === arrivalId ? { ...a, ArrivalTime: new Date().toISOString(), CheckInLatLong: location } : a));
        alert("Check-in successful!");
    }, []);

    const handleWhatsAppCaptain = useCallback(() => {
        const captain = teamMembers.find(m => m.Role === 'Captain');
        const number = captain?.PhoneNumber || "971501111111"; // Fallback number
        const text = encodeURIComponent("Hi Captain, I'm running late. ETA: ____");
        window.open(`https://wa.me/${number}?text=${text}`, '_blank');
    }, [teamMembers]);


    // --- ADMIN ACTIONS ---
    const adminActions = {
        startMatch: useCallback((date: string) => {
            setKitTracker(prev => prev.map(k => k.Date === date ? { ...k, MatchOn: true } : k));
        }, []),
        
        cancelMatch: useCallback((date: string) => {
            setKitTracker(prev => {
                const updated = [...prev];
                const matchIndex = updated.findIndex(k => k.Date === date);
                if (matchIndex === -1) return prev;

                const sortedHistory = updated.filter(k => new Date(k.Date) < new Date(date)).sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
                const lastMatch = sortedHistory[0];

                updated[matchIndex] = {
                    ...updated[matchIndex],
                    MatchOn: false,
                    Status: KitStatus.NoPlay,
                    KitResponsible: lastMatch ? lastMatch.KitResponsible : updated[matchIndex].ProvisionalAssignee,
                    WeeksHeld: lastMatch ? lastMatch.WeeksHeld + 1 : 1,
                };
                return updated;
            });
        }, []),

        decideCarrier: useCallback((date: string) => {
            const match = kitTracker.find(k => k.Date === date);
            if (!match) return;

            const latecomers = arrivals
                .filter(a => a.MatchDate === date && a.ArrivalTime && (new Date(a.ArrivalTime) > new Date(`${date}T${match.CutoffTime}`)))
                .map(a => ({ ...a, memberDetails: teamMembers.find(m => m.MemberID === a.Member) }))
                .filter(a => a.memberDetails?.PenaltyEligible)
                .sort((a,b) => new Date(b.ArrivalTime!).getTime() - new Date(a.ArrivalTime!).getTime());

            const penaltyCarrier = latecomers.length > 0 ? latecomers[0].Member : match.ProvisionalAssignee;
            
            setKitTracker(prev => prev.map(k => k.Date === date ? {
                ...k,
                KitResponsible: penaltyCarrier,
                TakenOnBehalfOf: penaltyCarrier !== k.ProvisionalAssignee ? k.ProvisionalAssignee : ""
            } : k));
        }, [kitTracker, arrivals, teamMembers]),

        sendPenaltyWhatsApp: useCallback((date: string) => {
            const match = kitTracker.find(k => k.Date === date);
            const carrier = teamMembers.find(m => m.MemberID === match?.KitResponsible);
            if (!match || !carrier) {
                alert("Kit carrier not decided yet.");
                return;
            }
            const phone = carrier.PhoneNumber.replace(/\s+/g, '');
            const text = encodeURIComponent(`Hi ${carrier.Name}, as you arrived after ${match.CutoffTime} today, you'll carry the kit as per rule. Please confirm.`);
            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        }, [kitTracker, teamMembers]),

        sendRotationWhatsApp: useCallback((date: string) => {
            const match = kitTracker.find(k => k.Date === date);
            const assignee = teamMembers.find(m => m.MemberID === match?.ProvisionalAssignee);
            if (!match || !assignee) {
                alert("Provisional assignee not set for today's match.");
                return;
            }
            const phone = assignee.PhoneNumber.replace(/\s+/g, '');
            const text = encodeURIComponent(`Hi ${assignee.Name}, you're scheduled to carry the kit on ${new Date(date).toDateString()}. Please confirm.`);
            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        }, [kitTracker, teamMembers]),
        
        confirmHandover: useCallback((date: string) => {
            const currentMatch = kitTracker.find(k => k.Date === date);
            if (!currentMatch) {
                alert("Match not found.");
                return;
            }
            if (!currentMatch.KitResponsible) {
                alert("Cannot confirm handover. Kit Responsible not set.");
                return;
            }
        
            // 1. Create the new team members state
            const updatedTeamMembers = teamMembers.map(m =>
                m.MemberID === currentMatch.KitResponsible
                    ? { ...m, CompletedInRound: true }
                    : m
            );
        
            // 2. Find the next provisional assignee from the *updated* team members list
            const eligibleMembers = updatedTeamMembers
                .filter(m => m.RotationEligible === "Yes" && !m.CompletedInRound && m.Status === MemberStatus.Active)
                .sort((a, b) => a.Order - b.Order);
            
            const nextProvisionalAssigneeId = eligibleMembers.length > 0 ? eligibleMembers[0].MemberID : null;
        
            // 3. Create the new kit tracker state
            let updatedKitTracker = kitTracker.map(k => {
                if (k.Date === date) {
                    const sortedHistory = kitTracker
                        .filter(h => new Date(h.Date) < new Date(date))
                        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
                    
                    const lastMatch = sortedHistory[0];
                    let weeksHeld = 1;
                    if (lastMatch && lastMatch.KitResponsible === currentMatch.KitResponsible) {
                        weeksHeld = lastMatch.WeeksHeld + 1;
                    }
                    return { ...k, Status: KitStatus.Completed, WeeksHeld: weeksHeld };
                }
                return k;
            });
        
            // 4. Find the next upcoming match and update its provisional assignee
            const nextUpcomingMatch = updatedKitTracker
                .filter(k => k.Status === KitStatus.Upcoming && new Date(k.Date) > new Date(date))
                .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
                [0];
        
            if (nextUpcomingMatch && nextProvisionalAssigneeId) {
                updatedKitTracker = updatedKitTracker.map(k =>
                    k.Date === nextUpcomingMatch.Date
                        ? { ...k, ProvisionalAssignee: nextProvisionalAssigneeId }
                        : k
                );
            }
            
            // 5. Set the new state
            setKitTracker(updatedKitTracker);
            setTeamMembers(updatedTeamMembers);
            alert("Handover confirmed. Next kit carrier has been provisionally assigned.");
        
        }, [teamMembers, kitTracker]),
        
        resetRound: useCallback(() => {
            setTeamMembers(prev => prev.map(m => ({ ...m, CompletedInRound: false })));
            alert("Round has been reset for all members.");
        }, []),

        updateMatchDetails: useCallback((date: string, newDetails: { lat: number; lng: number; radius: number; dueDate: string; }) => {
            if (new Date(newDetails.dueDate) < new Date(date)) {
                alert("Validation Error: The due date cannot be before the match date.");
                return;
            }

            setKitTracker(prev => prev.map(k => k.Date === date ? { 
                ...k, 
                GroundLatLong: { lat: newDetails.lat, lng: newDetails.lng },
                GeoRadiusMeters: newDetails.radius,
                DueDate: newDetails.dueDate,
            } : k));
            alert("Match details updated successfully!");
        }, []),

        updateArrivalTime: useCallback((arrivalId: string, newTime: string) => {
            if (!newTime) {
                setArrivals(prev => prev.map(a => a.ArrivalID === arrivalId ? { ...a, ArrivalTime: null, CheckInLatLong: null } : a));
                alert("Arrival time cleared.");
                return;
            }
        
            const newArrivalTime = new Date(newTime);
            if (newArrivalTime > new Date()) {
                alert("Validation Error: Arrival time cannot be in the future.");
                return;
            }
        
            setArrivals(prev => prev.map(a => a.ArrivalID === arrivalId ? { ...a, ArrivalTime: newArrivalTime.toISOString() } : a));
            alert("Arrival time updated.");
        }, []),

        updateTeamMember: useCallback((memberId: string, updatedData: Partial<Pick<TeamMember, 'Name' | 'PhoneNumber' | 'OwnsCar' | 'Status'>>) => {
            setTeamMembers(prev => prev.map(member => 
                member.MemberID === memberId
                    ? { ...member, ...updatedData }
                    : member
            ));
            alert("Member details updated.");
        }, []),
    };

    if (!currentUser) {
        return <UserSelector members={teamMembers} onSelectUser={handleSelectUser} />;
    }

    const renderContent = () => {
        if (view === 'profile') {
            return (
                <UserProfile 
                    currentUser={currentUser}
                    onUpdateProfile={handleUpdateUserProfile}
                    onBack={() => setView('dashboard')}
                />
            );
        }

        return (
            <>
                {currentUser.IsAdmin && (
                    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 flex space-x-1">
                        <button onClick={() => setActiveTab('user')} className={`w-full text-center px-4 py-2 font-semibold rounded-md transition ${activeTab === 'user' ? 'bg-brand-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>My View</button>
                        <button onClick={() => setActiveTab('admin')} className={`w-full text-center px-4 py-2 font-semibold rounded-md transition ${activeTab === 'admin' ? 'bg-brand-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Admin Panel</button>
                    </div>
                )}
                
                <div className={`${currentUser.IsAdmin && activeTab !== 'user' ? 'hidden' : 'block'}`}>
                    <UserPanel 
                        currentUser={currentUser}
                        teamMembers={teamMembers}
                        kitTracker={kitTracker}
                        arrivals={arrivals}
                        onCheckIn={handleCheckIn}
                        onWhatsAppCaptain={handleWhatsAppCaptain}
                    />
                </div>
                
                {currentUser.IsAdmin && (
                    <div className={`${activeTab !== 'admin' ? 'hidden' : 'block'}`}>
                        <AdminPanel 
                            teamMembers={teamMembers}
                            kitTracker={kitTracker}
                            arrivals={arrivals}
                            actions={adminActions}
                        />
                    </div>
                )}
            </>
        );
    }

    return (
        <DashboardShell 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onNavigateToProfile={() => setView('profile')}
        >
           {renderContent()}
        </DashboardShell>
    );
};

export default App;