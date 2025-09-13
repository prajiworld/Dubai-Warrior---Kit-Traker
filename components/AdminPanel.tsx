

import React, { useMemo, useState, useEffect } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { KitStatus, MemberStatus } from '../types';
import { getDistanceInMeters, formatDate, formatTime } from '../utils/helpers';
import { CheckCircleIcon, XCircleIcon } from './Icons';
import StatusBadge from './StatusBadge';
import DataManagementPanel from './DataManagementPanel';
import KitHistoryPanel from './KitHistoryPanel';


interface AdminPanelProps {
  teamMembers: TeamMember[];
  kitTracker: KitTrackerEntry[];
  arrivals: Arrival[];
  actions: {
    startMatch: (date: string) => void;
    cancelMatch: (date: string) => void;
    decideCarrier: (date: string) => void;
    sendPenaltyWhatsApp: (date: string) => void;
    sendRotationWhatsApp: (date: string) => void;
    confirmHandover: (date: string) => void;
    resetRound: () => void;
    updateMatchDetails: (date: string, newDetails: { lat: number; lng: number; radius: number; dueDate: string; }) => void;
    updateArrivalTime: (arrivalId: string, newTime: string) => void;
    updateTeamMember: (member: TeamMember) => void;
    // History Action
    notifyNextPlayer: () => void;
    // Master Data Actions
    addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
    deleteTeamMember: (memberId: string) => void;
    addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn'>) => void;
    updateMatch: (match: KitTrackerEntry) => void;
    deleteMatch: (date: string) => void;
    // Bulk Actions
    addBulkTeamMembers: (data: any[]) => { added: number, skipped: number };
    addBulkMatches: (data: any[]) => { added: number, skipped: number };
  }
}

const EditableArrivalRow: React.FC<{
    arrival: ArrivalWithDetails;
    onSave: (arrivalId: string, newTime: string) => void;
}> = ({ arrival, onSave }) => {
    // Helper to format an ISO string into a YYYY-MM-DDTHH:mm string for the input
    const toDateTimeLocal = (isoString: string | null) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [timeValue, setTimeValue] = useState(toDateTimeLocal(arrival.ArrivalTime));
    const [isDirty, setIsDirty] = useState(false);

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimeValue(e.target.value);
        setIsDirty(true);
    };

    const handleSave = () => {
        const isoString = timeValue ? new Date(timeValue).toISOString() : "";
        onSave(arrival.ArrivalID, isoString);
        setIsDirty(false);
    };

    return (
        <tr className="border-b dark:border-gray-700">
            <td className="px-4 py-2 font-medium">{arrival.MemberName}</td>
            <td className="px-4 py-2">
                <input
                    type="datetime-local"
                    value={timeValue}
                    onChange={handleTimeChange}
                    className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
                />
            </td>
            <td className="px-4 py-2">
                {arrival.ArrivalTime ? (
                    arrival.isLate ? <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Late</span>
                                   : <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">On Time</span>
                ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Pending</span>
                )}
            </td>
            <td className="px-4 py-2">
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className="px-3 py-1 bg-brand-primary text-white text-xs font-medium rounded-md hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Save
                </button>
            </td>
        </tr>
    );
};

// Sub-component for Dashboard
const TodayDashboard: React.FC<Omit<AdminPanelProps, 'actions'> & { todayMatch?: KitTrackerEntry; arrivalsToday: ArrivalWithDetails[], actions: AdminPanelProps['actions'] }> = ({ todayMatch, arrivalsToday, actions }) => {
    if (!todayMatch) {
        return <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">No match scheduled for today.</div>;
    }

    const { Date: matchDate } = todayMatch;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold">Today's Dashboard</h3>
                    <p className="text-gray-500 dark:text-gray-400">{formatDate(matchDate)}</p>
                </div>
                {todayMatch.MatchOn && <span className="px-3 py-1 text-sm font-bold text-white bg-green-600 rounded-full">MATCH ON</span>}
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                <button onClick={() => actions.startMatch(matchDate)} disabled={todayMatch.MatchOn} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400">Start Match</button>
                <button onClick={() => actions.decideCarrier(matchDate)} disabled={!todayMatch.MatchOn} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400">Decide Carrier</button>
                <button onClick={() => actions.confirmHandover(matchDate)} className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Confirm Handover</button>
                <button onClick={() => actions.cancelMatch(matchDate)} className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Cancel/No-Play</button>
                <button onClick={() => actions.sendPenaltyWhatsApp(matchDate)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 col-span-2 md:col-span-1">Penalty WhatsApp</button>
                <button onClick={() => actions.sendRotationWhatsApp(matchDate)} className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 col-span-2 md:col-span-1">Rotation WhatsApp</button>
            </div>

            {/* Inline Arrivals View */}
            <h4 className="text-lg font-semibold mb-2">Today's Arrivals</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-2">Player</th>
                            <th className="px-4 py-2">Arrival Time (Editable)</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {arrivalsToday.map(arrival => (
                            <EditableArrivalRow 
                                key={arrival.ArrivalID}
                                arrival={arrival}
                                onSave={actions.updateArrivalTime}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const EditableMemberRow: React.FC<{
    member: TeamMember;
    onSave: (member: TeamMember) => void;
}> = ({ member, onSave }) => {
    const [name, setName] = useState(member.Name);
    const [phone, setPhone] = useState(member.PhoneNumber);
    const [ownsCar, setOwnsCar] = useState(member.OwnsCar);
    const [status, setStatus] = useState(member.Status);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const hasChanged = name !== member.Name || phone !== member.PhoneNumber || ownsCar !== member.OwnsCar || status !== member.Status;
        setIsDirty(hasChanged);
    }, [name, phone, ownsCar, status, member]);

    const handleSave = () => {
        onSave({ ...member, Name: name, PhoneNumber: phone, OwnsCar: ownsCar, Status: status });
        setIsDirty(false);
    }
    
    const inputClass = "w-full text-sm px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent";

    return (
        <tr className="border-b dark:border-gray-700">
            <td className="px-4 py-2">{member.Order}</td>
            <td className="px-4 py-2"><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} /></td>
            <td className="px-4 py-2"><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} /></td>
            <td className="px-4 py-2 text-center"><input type="checkbox" checked={ownsCar} onChange={e => setOwnsCar(e.target.checked)} className="focus:ring-brand-accent h-4 w-4 text-brand-primary border-gray-300 rounded"/></td>
            <td className="px-4 py-2">
                <select value={status} onChange={e => setStatus(e.target.value as MemberStatus)} className={inputClass}>
                    {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </td>
            <td className="px-4 py-2">{member.CompletedInRound ? <CheckCircleIcon className="text-green-500 mx-auto" /> : <XCircleIcon className="text-red-500 mx-auto" />}</td>
            <td className="px-4 py-2">
                 <button onClick={handleSave} disabled={!isDirty} className="px-3 py-1 bg-brand-primary text-white text-xs font-medium rounded-md hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Save
                </button>
            </td>
        </tr>
    );
};

// Sub-component for Roster & Round Control
const RosterControl: React.FC<Pick<AdminPanelProps, 'teamMembers' | 'actions'>> = ({ teamMembers, actions }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Roster & Round Control</h3>
                <button onClick={actions.resetRound} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Reset Round</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-2">Order</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Phone</th>
                            <th className="px-4 py-2">Owns Car?</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Round Done?</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamMembers.sort((a,b) => a.Order - b.Order).map(member => (
                           <EditableMemberRow key={member.MemberID} member={member} onSave={actions.updateTeamMember} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Sub-component for individual editable match cards
const MatchCard: React.FC<{ match: KitTrackerEntry; onSave: (date: string, newDetails: { lat: number; lng: number; radius: number; dueDate: string; }) => void }> = ({ match, onSave }) => {
    const [lat, setLat] = useState(match.GroundLatLong.lat);
    const [lng, setLng] = useState(match.GroundLatLong.lng);
    const [radius, setRadius] = useState(match.GeoRadiusMeters);
    const [dueDate, setDueDate] = useState(match.DueDate);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const hasChanged = match.GroundLatLong.lat !== lat || match.GroundLatLong.lng !== lng || match.GeoRadiusMeters !== radius || match.DueDate !== dueDate;
        setIsDirty(hasChanged);
    }, [lat, lng, radius, dueDate, match]);

    const handleSave = () => {
        onSave(match.Date, { lat: Number(lat), lng: Number(lng), radius: Number(radius), dueDate });
        setIsDirty(false);
    };

    const inputClasses = "block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm";

    return (
        <details className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <summary className="font-semibold cursor-pointer flex justify-between items-center">
                <span>{formatDate(match.Date)}</span>
                <StatusBadge status={match.Status} />
            </summary>
            <div className="mt-4 pt-4 border-t dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor={`lat-${match.Date}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                        <input type="number" id={`lat-${match.Date}`} value={lat} onChange={e => setLat(parseFloat(e.target.value))} className={inputClasses}/>
                    </div>
                    <div>
                        <label htmlFor={`lng-${match.Date}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                        <input type="number" id={`lng-${match.Date}`} value={lng} onChange={e => setLng(parseFloat(e.target.value))} className={inputClasses}/>
                    </div>
                    <div>
                        <label htmlFor={`radius-${match.Date}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Geo Radius (m)</label>
                        <input type="number" id={`radius-${match.Date}`} value={radius} onChange={e => setRadius(parseInt(e.target.value, 10))} className={inputClasses}/>
                    </div>
                    <div>
                        <label htmlFor={`dueDate-${match.Date}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input type="date" id={`dueDate-${match.Date}`} value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClasses}/>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleSave} disabled={!isDirty} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition">
                        Save Changes
                    </button>
                </div>
            </div>
        </details>
    )
}

// Sub-component for Match Management
const MatchManagement: React.FC<Pick<AdminPanelProps, 'kitTracker' | 'actions'>> = ({ kitTracker, actions }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Match Management</h3>
            <div className="space-y-4">
                {kitTracker.sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).map(match => (
                    <MatchCard key={match.Date} match={match} onSave={actions.updateMatchDetails} />
                ))}
            </div>
        </div>
    );
};


interface ArrivalWithDetails extends Arrival {
    MemberName: string;
    isLate: boolean;
    isWithinGeofence: boolean;
    distanceMeters: number | null;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const { kitTracker, arrivals, teamMembers, actions } = props;
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Derived state ("Slices")
    const todayMatch = useMemo(() => {
        const sortedMatches = [...kitTracker]
            .filter(k => new Date(k.Date) >= new Date(new Date().toDateString()))
            .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        return sortedMatches[0];
    }, [kitTracker]);
    
    const arrivalsToday = useMemo<ArrivalWithDetails[]>(() => {
        if (!todayMatch) return [];
        return arrivals
            .filter(a => a.MatchDate === todayMatch.Date)
            .map(arrival => {
                const member = teamMembers.find(m => m.MemberID === arrival.Member);
                const isLate = arrival.ArrivalTime ? (new Date(arrival.ArrivalTime) > new Date(`${todayMatch.Date}T${todayMatch.CutoffTime}`)) : false;
                const distanceMeters = arrival.CheckInLatLong ? getDistanceInMeters(arrival.CheckInLatLong.lat, arrival.CheckInLatLong.lng, todayMatch.GroundLatLong.lat, todayMatch.GroundLatLong.lng) : null;
                const isWithinGeofence = distanceMeters !== null && distanceMeters <= todayMatch.GeoRadiusMeters;
                return {
                    ...arrival,
                    MemberName: member?.Name || 'Unknown',
                    isLate,
                    isWithinGeofence,
                    distanceMeters,
                };
            });
    }, [todayMatch, arrivals, teamMembers]);


    const tabs = {
        dashboard: <TodayDashboard {...props} todayMatch={todayMatch} arrivalsToday={arrivalsToday}/>,
        roster: <RosterControl {...props} />,
        matches: <MatchManagement {...props} />,
        history: <KitHistoryPanel {...props} />,
        data: <DataManagementPanel 
                teamMembers={teamMembers} 
                kitTracker={kitTracker} 
                actions={{
                    addTeamMember: actions.addTeamMember,
                    updateTeamMember: actions.updateTeamMember,
                    deleteTeamMember: actions.deleteTeamMember,
                    addMatch: actions.addMatch,
                    updateMatch: actions.updateMatch,
                    deleteMatch: actions.deleteMatch,
                    addBulkTeamMembers: actions.addBulkTeamMembers,
                    addBulkMatches: actions.addBulkMatches,
                }} 
              />,
    };
    
    const getTabClass = (tabName: string) => {
        return `${activeTab === tabName ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`;
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveTab('dashboard')} className={getTabClass('dashboard')}>Dashboard</button>
                    <button onClick={() => setActiveTab('roster')} className={getTabClass('roster')}>Roster</button>
                    <button onClick={() => setActiveTab('matches')} className={getTabClass('matches')}>Matches</button>
                    <button onClick={() => setActiveTab('history')} className={getTabClass('history')}>History</button>
                    <button onClick={() => setActiveTab('data')} className={getTabClass('data')}>Master Data</button>
                </nav>
            </div>
            {tabs[activeTab as keyof typeof tabs]}
        </div>
    );
};

export default AdminPanel;