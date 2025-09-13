import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from './types';
import { MemberStatus, KitStatus } from './types';
import { INITIAL_TEAM_MEMBERS, INITIAL_KIT_TRACKER, INITIAL_ARRIVALS } from './constants';
import DashboardShell from './components/DashboardShell';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import LoginPage from './components/LoginPage';
import SignUpModal, { NewUserData } from './components/SignUpModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
// FIX: Import `formatDate` to be used in `sendPenaltyWhatsApp`.
import { formatDate } from './utils/helpers';


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
    const [modal, setModal] = useState<'signup' | 'forgotPassword' | null>(null);


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
    
    const handleLogin = useCallback((username: string, password: string): boolean => {
        const user = teamMembers.find(m => m.username.toLowerCase() === username.toLowerCase().trim() && m.password === password);
        if (user) {
            setCurrentUserId(user.MemberID);
            setView('dashboard');
            return true;
        }
        return false;
    }, [teamMembers]);

    const handleLogout = () => {
        setCurrentUserId(null);
        setView('dashboard');
    };
    
    const handleResetData = useCallback(() => {
        if (window.confirm("Are you sure you want to reset all application data? This will restore the initial team members and matches and cannot be undone.")) {
            localStorage.removeItem('MyMember');
            localStorage.removeItem('teamMembers');
            localStorage.removeItem('kitTracker');
            localStorage.removeItem('arrivals');
            window.location.reload();
        }
    }, []);
    
    // --- USER REGISTRATION ACTION ---
    const handleUserRegistration = useCallback((newUserData: NewUserData): boolean => {
        if (teamMembers.some(m => m.username.toLowerCase() === newUserData.username.toLowerCase())) {
            return false; // Indicate username exists
        }
        const maxOrder = Math.max(...teamMembers.map(m => m.Order), 0);
        const newMember: TeamMember = {
            ...newUserData,
            MemberID: `user${Date.now()}`,
            Role: 'Player',
            IsAdmin: false,
            OwnsCar: false,
            Status: MemberStatus.Active,
            RotationEligible: 'Yes',
            PenaltyEligible: true,
            Order: maxOrder + 1,
            CompletedInRound: false,
            Notes: 'New user signup.',
        };
        setTeamMembers(prev => [...prev, newMember]);
        alert('Sign up successful! You can now log in.');
        setModal(null); // Close modal on success
        return true;
    }, [teamMembers]);
    
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
                .filter(a => a.memberDetails && a.memberDetails.PenaltyEligible && a.memberDetails.OwnsCar);
            
            let carrierId: string;
            if (latecomers.length > 0) {
                latecomers.sort((a,b) => new Date(a.ArrivalTime!).getTime() - new Date(b.ArrivalTime!).getTime()); // Earliest latecomer
                carrierId = latecomers[0].Member;
            } else {
                carrierId = match.ProvisionalAssignee;
            }
            
            setKitTracker(prev => prev.map(k => k.Date === date ? { ...k, KitResponsible: carrierId } : k));
        }, [kitTracker, arrivals, teamMembers]),
        
        sendPenaltyWhatsApp: useCallback((date: string) => {
             const match = kitTracker.find(k => k.Date === date);
            if (!match) return;
            const latecomers = arrivals
                .filter(a => a.MatchDate === date && a.ArrivalTime && (new Date(a.ArrivalTime) > new Date(`${date}T${match.CutoffTime}`)))
                .map(a => teamMembers.find(m => m.MemberID === a.Member)?.Name)
                .filter(Boolean);
            
            const message = `Penalty Notice for ${formatDate(date)}:\nThe following players arrived late: ${latecomers.join(', ')}.`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }, [kitTracker, arrivals, teamMembers]),

        sendRotationWhatsApp: useCallback((date: string) => {
            const rotation = teamMembers
                .filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active)
                .sort((a, b) => a.Order - b.Order)
                .map((m, i) => `${i + 1}. ${m.Name} ${m.CompletedInRound ? '(Done)' : ''}`)
                .join('\n');
            const message = `Current Kit Rotation:\n${rotation}`;
             window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }, [teamMembers]),

        confirmHandover: useCallback((date: string) => {
            setKitTracker(prev => {
                const currentMatch = prev.find(k => k.Date === date);
                if (!currentMatch || !currentMatch.KitResponsible) {
                    alert("Kit responsible person not decided yet.");
                    return prev;
                }
                
                // Update match status
                const updatedTracker = prev.map(k => k.Date === date ? { ...k, Status: KitStatus.Completed } : k);
                
                // Update team member round completion
                setTeamMembers(tm => tm.map(m => m.MemberID === currentMatch.KitResponsible ? { ...m, CompletedInRound: true } : m));
                
                return updatedTracker;
            });
        }, []),

        resetRound: useCallback(() => {
            if(window.confirm("Are you sure you want to reset the kit rotation round for all members?")) {
                setTeamMembers(prev => prev.map(m => ({ ...m, CompletedInRound: false })));
            }
        }, []),
        
        updateMatchDetails: useCallback((date: string, newDetails: { lat: number, lng: number, radius: number, dueDate: string }) => {
            setKitTracker(prev => prev.map(match => 
                match.Date === date 
                    ? { ...match, GroundLatLong: { lat: newDetails.lat, lng: newDetails.lng }, GeoRadiusMeters: newDetails.radius, DueDate: newDetails.dueDate } 
                    : match
            ));
        }, []),

        updateArrivalTime: useCallback((arrivalId: string, newTime: string) => {
            setArrivals(prev => prev.map(a => a.ArrivalID === arrivalId ? { ...a, ArrivalTime: newTime || null } : a));
        }, []),
        
        // This is the full member update from RosterControl or DataManagementPanel Edit
        updateTeamMember: useCallback((member: TeamMember) => {
            setTeamMembers(prev => prev.map(m => m.MemberID === member.MemberID ? member : m));
        }, []),
        
        // Master Data Actions
        addTeamMember: useCallback((memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => {
            const newMember: TeamMember = {
                ...memberData,
                MemberID: `user${Date.now()}`,
                CompletedInRound: false,
            };
            setTeamMembers(prev => [...prev, newMember]);
        }, []),

        deleteTeamMember: useCallback((memberId: string) => {
            setTeamMembers(prev => prev.filter(m => m.MemberID !== memberId));
            setArrivals(prev => prev.filter(a => a.Member !== memberId));
        }, []),
        
        addMatch: useCallback((matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn'>) => {
            const eligibleMembers = teamMembers
                .filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active && !m.CompletedInRound)
                .sort((a,b) => a.Order - b.Order);
                
            const provisionalAssignee = eligibleMembers.length > 0 ? eligibleMembers[0].MemberID : (teamMembers[0]?.MemberID || '');

            const newMatch: KitTrackerEntry = {
                ...matchData,
                ProvisionalAssignee: provisionalAssignee,
                KitResponsible: '',
                TakenOnBehalfOf: '',
                Status: KitStatus.Upcoming,
                WeeksHeld: 0,
                MatchOn: false,
            };
            setKitTracker(prev => [...prev, newMatch]);
            
            // Auto-create arrivals for active members
            const newArrivals = teamMembers
                .filter(m => m.Status === MemberStatus.Active)
                .map(m => ({
                    ArrivalID: `arr_${newMatch.Date}_${m.MemberID}`,
                    MatchDate: newMatch.Date,
                    Member: m.MemberID,
                    ArrivalTime: null,
                    CheckInLatLong: null,
                }));
            setArrivals(prev => [...prev, ...newArrivals]);
        }, [teamMembers]),
        
        updateMatch: useCallback((match: KitTrackerEntry) => {
            setKitTracker(prev => prev.map(k => k.Date === match.Date ? match : k));
        }, []),

        deleteMatch: useCallback((date: string) => {
            setKitTracker(prev => prev.filter(k => k.Date !== date));
            setArrivals(prev => prev.filter(a => a.MatchDate !== date));
        }, []),

        // Bulk Actions
        addBulkTeamMembers: useCallback((data: any[]): { added: number, skipped: number } => {
            let added = 0;
            let skipped = 0;
            const newMembers: TeamMember[] = [];
            
            const existingUsernames = new Set(teamMembers.map(m => m.username.toLowerCase()));
            const maxOrder = Math.max(...teamMembers.map(m => m.Order), 0);

            data.forEach((row, index) => {
                const username = row.username?.trim().toLowerCase();
                if (!username || existingUsernames.has(username)) {
                    skipped++;
                    return;
                }
                
                const newMember: TeamMember = {
                    MemberID: `user_csv_${Date.now()}_${index}`,
                    Name: row.Name || 'Unnamed',
                    username: row.username,
                    password: row.password || 'password',
                    Role: row.Role || 'Player',
                    IsAdmin: row.IsAdmin?.toUpperCase() === 'TRUE',
                    PhoneNumber: row.PhoneNumber || '',
                    OwnsCar: row.OwnsCar?.toUpperCase() === 'TRUE',
                    Status: Object.values(MemberStatus).includes(row.Status) ? row.Status : MemberStatus.Active,
                    RotationEligible: row.RotationEligible === 'No' ? 'No' : 'Yes',
                    PenaltyEligible: row.PenaltyEligible?.toUpperCase() !== 'FALSE',
                    Order: parseInt(row.Order) || (maxOrder + index + 1),
                    CompletedInRound: false,
                    Notes: row.Notes || '',
                };
                newMembers.push(newMember);
                existingUsernames.add(username);
                added++;
            });

            setTeamMembers(prev => [...prev, ...newMembers]);
            return { added, skipped };
        }, [teamMembers]),

        addBulkMatches: useCallback((data: any[]): { added: number, skipped: number } => {
            let added = 0;
            let skipped = 0;
            const newMatches: KitTrackerEntry[] = [];
            const newArrivalsForMatches: Arrival[] = [];

            const existingDates = new Set(kitTracker.map(k => k.Date));
            const activeMembers = teamMembers.filter(m => m.Status === MemberStatus.Active);


            data.forEach(row => {
                const date = row.Date?.trim();
                if (!date || existingDates.has(date)) {
                    skipped++;
                    return;
                }
                
                const eligibleMembers = teamMembers
                    .filter(m => m.RotationEligible === 'Yes' && m.Status === MemberStatus.Active && !m.CompletedInRound)
                    .sort((a,b) => a.Order - b.Order);
                const provisionalAssignee = eligibleMembers.length > 0 ? eligibleMembers[0].MemberID : (teamMembers[0]?.MemberID || '');

                const newMatch: KitTrackerEntry = {
                    Date: date,
                    DueDate: row.DueDate || date,
                    GroundLatLong: { lat: parseFloat(row.Lat) || 0, lng: parseFloat(row.Lng) || 0 },
                    GeoRadiusMeters: parseInt(row.GeoRadiusMeters) || 250,
                    CutoffTime: row.CutoffTime || '22:45',
                    Notes: row.Notes || '',
                    ProvisionalAssignee: provisionalAssignee,
                    KitResponsible: '',
                    TakenOnBehalfOf: '',
                    Status: KitStatus.Upcoming,
                    WeeksHeld: 0,
                    MatchOn: false,
                };
                newMatches.push(newMatch);
                existingDates.add(date);

                // Create arrivals for this new match
                const arrivalsForThisMatch = activeMembers.map(m => ({
                    ArrivalID: `arr_${newMatch.Date}_${m.MemberID}`,
                    MatchDate: newMatch.Date,
                    Member: m.MemberID,
                    ArrivalTime: null,
                    CheckInLatLong: null,
                }));
                newArrivalsForMatches.push(...arrivalsForThisMatch);
                added++;
            });

            setKitTracker(prev => [...prev, ...newMatches]);
            setArrivals(prev => [...prev, ...newArrivalsForMatches]);
            return { added, skipped };
        }, [kitTracker, teamMembers]),
    };

    if (!currentUser) {
        return (
            <>
                <LoginPage onLogin={handleLogin} onShowSignUp={() => setModal('signup')} onShowForgotPassword={() => setModal('forgotPassword')} onResetData={handleResetData} />
                {modal === 'signup' && <SignUpModal onClose={() => setModal(null)} onSignUp={handleUserRegistration} />}
                {modal === 'forgotPassword' && <ForgotPasswordModal onClose={() => setModal(null)} teamMembers={teamMembers} />}
            </>
        );
    }
    
    const tabs = {
        user: <UserPanel 
                currentUser={currentUser} 
                teamMembers={teamMembers}
                kitTracker={kitTracker}
                arrivals={arrivals}
                onCheckIn={handleCheckIn}
                onWhatsAppCaptain={handleWhatsAppCaptain}
              />,
        admin: <AdminPanel 
                teamMembers={teamMembers}
                kitTracker={kitTracker}
                arrivals={arrivals}
                actions={adminActions}
              />,
    };

    return (
       <DashboardShell currentUser={currentUser} onLogout={handleLogout} onNavigateToProfile={() => setView('profile')}>
        {view === 'profile' ? (
             <UserProfile currentUser={currentUser} onUpdateProfile={handleUpdateUserProfile} onBack={() => setView('dashboard')} />
        ) : (
             <>
                {currentUser.IsAdmin && (
                    <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                             <button onClick={() => setActiveTab('user')} className={`${activeTab === 'user' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                My View
                            </button>
                            <button onClick={() => setActiveTab('admin')} className={`${activeTab === 'admin' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Admin Panel
                            </button>
                        </nav>
                    </div>
                )}
                
                {activeTab === 'admin' && currentUser.IsAdmin ? tabs.admin : tabs.user}
            </>
        )}
       </DashboardShell>
    );
};

export default App;