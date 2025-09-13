import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { MemberStatus, KitStatus } from '../types';

const EMPTY_MEMBER: Omit<TeamMember, 'MemberID' | 'CompletedInRound'> = {
    Name: '',
    username: '',
    password: '',
    Role: 'Player',
    IsAdmin: false,
    PhoneNumber: '',
    OwnsCar: false,
    Status: MemberStatus.Active,
    RotationEligible: 'Yes',
    PenaltyEligible: true,
    Order: 100,
    Notes: '',
};

const EMPTY_MATCH: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn'> = {
    Date: new Date().toISOString().split('T')[0],
    DueDate: new Date().toISOString().split('T')[0],
    GroundLatLong: { lat: 25.0763, lng: 55.1886 },
    GeoRadiusMeters: 250,
    CutoffTime: '22:45',
    Notes: '',
};

interface DataManagementPanelProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    actions: {
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
    };
}

const DataManagementPanel: React.FC<DataManagementPanelProps> = ({ teamMembers, kitTracker, actions }) => {
    const [editingMember, setEditingMember] = useState<TeamMember | Omit<TeamMember, 'MemberID' | 'CompletedInRound'> | null>(null);
    const [editingMatch, setEditingMatch] = useState<KitTrackerEntry | typeof EMPTY_MATCH | null>(null);

    const handleMemberFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        if ('MemberID' in editingMember) {
            actions.updateTeamMember(editingMember);
        } else {
            actions.addTeamMember(editingMember);
        }
        setEditingMember(null);
    };
    
    const handleMatchFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMatch) return;

        if ('Status' in editingMatch) {
             const { Status, ...rest } = editingMatch; // Omit fields not in the update action
            actions.updateMatch(editingMatch);
        } else {
            actions.addMatch(editingMatch);
        }
        setEditingMatch(null);
    };

    const inputClass = "block w-full text-sm px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const buttonClass = "px-4 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50";


    return (
        <div className="space-y-8">
            {/* Member Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Team Member Management</h3>
                    <button onClick={() => setEditingMember(EMPTY_MEMBER)} className={`${buttonClass} bg-brand-primary hover:bg-brand-secondary`}>Add New Member</button>
                </div>

                {editingMember && (
                    <form onSubmit={handleMemberFormSubmit} className="p-4 my-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                        <h4 className="font-semibold text-lg">{'MemberID' in editingMember ? 'Edit Member' : 'Add Member'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Form fields */}
                            <div><label className={labelClass}>Name</label><input type="text" value={editingMember.Name} onChange={e => setEditingMember({...editingMember, Name: e.target.value})} className={inputClass} required/></div>
                            <div><label className={labelClass}>Username</label><input type="text" value={editingMember.username} onChange={e => setEditingMember({...editingMember, username: e.target.value})} className={inputClass} required disabled={'MemberID' in editingMember}/></div>
                            <div><label className={labelClass}>Password</label><input type="password" placeholder={'MemberID' in editingMember ? 'Unchanged' : ''} onChange={e => setEditingMember({...editingMember, password: e.target.value})} className={inputClass} required={!('MemberID' in editingMember)}/></div>
                            <div><label className={labelClass}>Phone Number</label><input type="tel" value={editingMember.PhoneNumber} onChange={e => setEditingMember({...editingMember, PhoneNumber: e.target.value})} className={inputClass}/></div>
                            <div><label className={labelClass}>Role</label><input type="text" value={editingMember.Role} onChange={e => setEditingMember({...editingMember, Role: e.target.value})} className={inputClass}/></div>
                            <div><label className={labelClass}>Order</label><input type="number" value={editingMember.Order} onChange={e => setEditingMember({...editingMember, Order: parseInt(e.target.value, 10)})} className={inputClass}/></div>
                            <div><label className={labelClass}>Status</label><select value={editingMember.Status} onChange={e => setEditingMember({...editingMember, Status: e.target.value as MemberStatus})} className={inputClass}>{Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div><label className={labelClass}>Rotation Eligible</label><select value={editingMember.RotationEligible} onChange={e => setEditingMember({...editingMember, RotationEligible: e.target.value as "Yes" | "No"})} className={inputClass}><option value="Yes">Yes</option><option value="No">No</option></select></div>
                            <div className="flex items-center space-x-4"><div className="flex items-center"><input type="checkbox" checked={editingMember.IsAdmin} onChange={e => setEditingMember({...editingMember, IsAdmin: e.target.checked})} className="h-4 w-4"/><label className="ml-2">Is Admin?</label></div><div className="flex items-center"><input type="checkbox" checked={editingMember.OwnsCar} onChange={e => setEditingMember({...editingMember, OwnsCar: e.target.checked})} className="h-4 w-4"/><label className="ml-2">Owns Car?</label></div><div className="flex items-center"><input type="checkbox" checked={editingMember.PenaltyEligible} onChange={e => setEditingMember({...editingMember, PenaltyEligible: e.target.checked})} className="h-4 w-4"/><label className="ml-2">Penalty Eligible?</label></div></div>
                            <div className="col-span-full"><label className={labelClass}>Notes</label><textarea value={editingMember.Notes} onChange={e => setEditingMember({...editingMember, Notes: e.target.value})} className={inputClass}></textarea></div>
                        </div>
                        <div className="flex justify-end space-x-2"><button type="button" onClick={() => setEditingMember(null)} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>Cancel</button><button type="submit" className={`${buttonClass} bg-green-600 hover:bg-green-700`}>Save Member</button></div>
                    </form>
                )}
                
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead><tr className="border-b dark:border-gray-700"><th>Order</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{teamMembers.sort((a,b) => a.Order - b.Order).map(m => (<tr key={m.MemberID}><td>{m.Order}</td><td>{m.Name}</td><td>{m.Status}</td><td><button onClick={() => setEditingMember(m)}>Edit</button> | <button onClick={() => actions.deleteTeamMember(m.MemberID)}>Delete</button></td></tr>))}</tbody>
                </table>
                </div>
            </div>

            {/* Match Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Match Management</h3>
                    <button onClick={() => setEditingMatch(EMPTY_MATCH)} className={`${buttonClass} bg-brand-primary hover:bg-brand-secondary`}>Add New Match</button>
                </div>
                 {editingMatch && (
                    <form onSubmit={handleMatchFormSubmit} className="p-4 my-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                        <h4 className="font-semibold text-lg">{'Status' in editingMatch ? 'Edit Match' : 'Add Match'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div><label className={labelClass}>Match Date</label><input type="date" value={editingMatch.Date} onChange={e => setEditingMatch({...editingMatch, Date: e.target.value})} className={inputClass} required disabled={'Status' in editingMatch} /></div>
                            <div><label className={labelClass}>Due Date</label><input type="date" value={editingMatch.DueDate} onChange={e => setEditingMatch({...editingMatch, DueDate: e.target.value})} className={inputClass} required/></div>
                            <div><label className={labelClass}>Cutoff Time</label><input type="time" value={editingMatch.CutoffTime} onChange={e => setEditingMatch({...editingMatch, CutoffTime: e.target.value})} className={inputClass} required/></div>
                            <div><label className={labelClass}>Latitude</label><input type="number" step="any" value={editingMatch.GroundLatLong.lat} onChange={e => setEditingMatch({...editingMatch, GroundLatLong: {...editingMatch.GroundLatLong, lat: parseFloat(e.target.value)} })} className={inputClass} required/></div>
                            <div><label className={labelClass}>Longitude</label><input type="number" step="any" value={editingMatch.GroundLatLong.lng} onChange={e => setEditingMatch({...editingMatch, GroundLatLong: {...editingMatch.GroundLatLong, lng: parseFloat(e.target.value)} })} className={inputClass} required/></div>
                            <div><label className={labelClass}>Geo Radius (m)</label><input type="number" value={editingMatch.GeoRadiusMeters} onChange={e => setEditingMatch({...editingMatch, GeoRadiusMeters: parseInt(e.target.value,10)})} className={inputClass} required/></div>
                             {'Status' in editingMatch && (<div><label className={labelClass}>Status</label><select value={editingMatch.Status} onChange={e => setEditingMatch({...editingMatch, Status: e.target.value as KitStatus})} className={inputClass}>{Object.values(KitStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>)}
                            <div className="col-span-full"><label className={labelClass}>Notes</label><textarea value={editingMatch.Notes} onChange={e => setEditingMatch({...editingMatch, Notes: e.target.value})} className={inputClass}></textarea></div>
                        </div>
                        <div className="flex justify-end space-x-2"><button type="button" onClick={() => setEditingMatch(null)} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>Cancel</button><button type="submit" className={`${buttonClass} bg-green-600 hover:bg-green-700`}>Save Match</button></div>
                    </form>
                 )}
                <div className="space-y-2">
                    {kitTracker.sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).map(k => (<div key={k.Date} className="p-2 border dark:border-gray-700 rounded flex justify-between"><span>{k.Date}</span><div><button onClick={() => setEditingMatch(k)}>Edit</button> | <button onClick={() => actions.deleteMatch(k.Date)}>Delete</button></div></div>))}
                </div>
            </div>
        </div>
    );
};

export default DataManagementPanel;
