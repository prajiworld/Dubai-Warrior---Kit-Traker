import React, { useState, useEffect, useRef } from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { MemberStatus, KitStatus, AssignmentReason } from '../types';
import { PencilIcon, TrashIcon, XCircleIcon, DocumentArrowUpIcon } from './Icons';
import StatusBadge from './StatusBadge';
import { downloadFile, MEMBER_CSV_TEMPLATE, MATCH_CSV_TEMPLATE } from '../utils/helpers';


const EMPTY_MEMBER: Omit<TeamMember, 'MemberID' | 'CompletedInRound'> = {
    Name: '', username: '', password: '', Role: 'Player', IsAdmin: false, PhoneNumber: '',
    OwnsCar: false, Status: MemberStatus.Active, RotationEligible: 'Yes',
    PenaltyEligible: true, Order: 100, Notes: '',
};

const EMPTY_MATCH: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'> = {
    Date: new Date().toISOString().split('T')[0], DueDate: new Date().toISOString().split('T')[0],
    GroundLatLong: { lat: 25.0763, lng: 55.1886 }, GeoRadiusMeters: 250,
    CutoffTime: '22:45', Notes: '',
};

const inputClass = "block w-full text-sm px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const buttonClass = "px-4 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50";

interface MemberEditModalProps {
    member: TeamMember | typeof EMPTY_MEMBER;
    onSave: (member: TeamMember | typeof EMPTY_MEMBER) => void;
    onClose: () => void;
}

const MemberEditModal: React.FC<MemberEditModalProps> = ({ member, onSave, onClose }) => {
    const [formData, setFormData] = useState(member);
    useEffect(() => setFormData(member), [member]);

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field: 'IsAdmin' | 'OwnsCar' | 'PenaltyEligible', checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    const isNewMember = !('MemberID' in formData);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4" onClick={onClose}>
            <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg">{isNewMember ? 'Add New Member' : 'Edit Member'}</h4>
                        <button type="button" onClick={onClose}><XCircleIcon /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label className={labelClass}>Name</label><input type="text" value={formData.Name} onChange={e => handleChange('Name', e.target.value)} className={inputClass} required/></div>
                        <div><label className={labelClass}>Username</label><input type="text" value={formData.username} onChange={e => handleChange('username', e.target.value)} className={inputClass} required disabled={!isNewMember}/></div>
                        <div><label className={labelClass}>Password</label><input type="password" placeholder={isNewMember ? '' : 'Unchanged'} onChange={e => handleChange('password', e.target.value)} className={inputClass} required={isNewMember}/></div>
                        <div><label className={labelClass}>Phone Number</label><input type="tel" value={formData.PhoneNumber} onChange={e => handleChange('PhoneNumber', e.target.value)} className={inputClass}/></div>
                        <div><label className={labelClass}>Role</label><input type="text" value={formData.Role} onChange={e => handleChange('Role', e.target.value)} className={inputClass}/></div>
                        <div><label className={labelClass}>Order</label><input type="number" value={formData.Order} onChange={e => handleChange('Order', parseInt(e.target.value, 10))} className={inputClass}/></div>
                        <div><label className={labelClass}>Status</label><select value={formData.Status} onChange={e => handleChange('Status', e.target.value as MemberStatus)} className={inputClass}>{Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div><label className={labelClass}>Rotation Eligible</label><select value={formData.RotationEligible} onChange={e => handleChange('RotationEligible', e.target.value as "Yes" | "No")} className={inputClass}><option value="Yes">Yes</option><option value="No">No</option></select></div>
                        <div className="flex items-center space-x-4 pt-4"><div className="flex items-center"><input type="checkbox" id="isAdmin" checked={formData.IsAdmin} onChange={e => handleCheckboxChange('IsAdmin', e.target.checked)} className="h-4 w-4"/><label htmlFor="isAdmin" className="ml-2 text-sm">Is Admin?</label></div><div className="flex items-center"><input type="checkbox" id="ownsCar" checked={formData.OwnsCar} onChange={e => handleCheckboxChange('OwnsCar', e.target.checked)} className="h-4 w-4"/><label htmlFor="ownsCar" className="ml-2 text-sm">Owns Car?</label></div><div className="flex items-center"><input type="checkbox" id="penalty" checked={formData.PenaltyEligible} onChange={e => handleCheckboxChange('PenaltyEligible', e.target.checked)} className="h-4 w-4"/><label htmlFor="penalty" className="ml-2 text-sm">Penalty Eligible?</label></div></div>
                        <div className="col-span-full"><label className={labelClass}>Notes</label><textarea value={formData.Notes} onChange={e => handleChange('Notes', e.target.value)} className={inputClass} rows={2}></textarea></div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={onClose} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>Cancel</button><button type="submit" className={`${buttonClass} bg-green-600 hover:bg-green-700`}>Save Member</button></div>
                </form>
            </div>
        </div>
    )
}

interface MatchEditModalProps {
    match: KitTrackerEntry | typeof EMPTY_MATCH;
    onSave: (match: KitTrackerEntry | typeof EMPTY_MATCH) => void;
    onClose: () => void;
}

const MatchEditModal: React.FC<MatchEditModalProps> = ({ match, onSave, onClose }) => {
    const [formData, setFormData] = useState(match);
    useEffect(() => setFormData(match), [match]);
    const isNewMatch = !('Status' in formData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4" onClick={onClose}>
            <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                         <h4 className="font-semibold text-lg">{isNewMatch ? 'Add New Match' : 'Edit Match'}</h4>
                         <button type="button" onClick={onClose}><XCircleIcon /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label className={labelClass}>Match Date</label><input type="date" value={formData.Date} onChange={e => setFormData({...formData, Date: e.target.value})} className={inputClass} required disabled={!isNewMatch} /></div>
                        <div><label className={labelClass}>Due Date</label><input type="date" value={formData.DueDate} onChange={e => setFormData({...formData, DueDate: e.target.value})} className={inputClass} required/></div>
                        <div><label className={labelClass}>Cutoff Time</label><input type="time" value={formData.CutoffTime} onChange={e => setFormData({...formData, CutoffTime: e.target.value})} className={inputClass} required/></div>
                        <div><label className={labelClass}>Latitude</label><input type="number" step="any" value={formData.GroundLatLong.lat} onChange={e => setFormData({...formData, GroundLatLong: {...formData.GroundLatLong, lat: parseFloat(e.target.value)} })} className={inputClass} required/></div>
                        <div><label className={labelClass}>Longitude</label><input type="number" step="any" value={formData.GroundLatLong.lng} onChange={e => setFormData({...formData, GroundLatLong: {...formData.GroundLatLong, lng: parseFloat(e.target.value)} })} className={inputClass} required/></div>
                        <div><label className={labelClass}>Geo Radius (m)</label><input type="number" value={formData.GeoRadiusMeters} onChange={e => setFormData({...formData, GeoRadiusMeters: parseInt(e.target.value,10)})} className={inputClass} required/></div>
                         {!isNewMatch && (<div><label className={labelClass}>Status</label><select value={(formData as KitTrackerEntry).Status} onChange={e => setFormData({...formData, Status: e.target.value as KitStatus})} className={inputClass}>{Object.values(KitStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>)}
                        <div className="col-span-full"><label className={labelClass}>Notes</label><textarea value={formData.Notes} onChange={e => setFormData({...formData, Notes: e.target.value})} className={inputClass} rows={2}></textarea></div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={onClose} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>Cancel</button><button type="submit" className={`${buttonClass} bg-green-600 hover:bg-green-700`}>Save Match</button></div>
                </form>
            </div>
        </div>
    );
}

const CsvUploadSection: React.FC<{
    title: string;
    templateContent: string;
    templateFileName: string;
    onUpload: (data: any[]) => { added: number, skipped: number };
}> = ({ title, templateContent, templateFileName, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        downloadFile(templateContent, templateFileName, 'text/csv;charset=utf-8;');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') return;
            
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert('CSV file is empty or contains only headers.');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index]?.trim() || '';
                    return obj;
                }, {} as any);
            });

            const result = onUpload(data);
            alert(`Upload complete!\n\n${result.added} records added.\n${result.skipped} records skipped (duplicates or errors).`);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-semibold">{title}</h4>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <button onClick={handleDownloadTemplate} className="flex-1 text-center px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">Download Template</button>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id={`csv-upload-${title.replace(/\s+/g, '-')}`} />
                <label htmlFor={`csv-upload-${title.replace(/\s+/g, '-')}`} className="cursor-pointer flex-1 text-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center justify-center gap-2">
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    Upload CSV
                </label>
            </div>
        </div>
    );
};

interface DataManagementPanelProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
    actions: {
        addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
        updateTeamMember: (member: TeamMember) => void;
        deleteTeamMember: (memberId: string) => void;
        addMatch: (matchData: Omit<KitTrackerEntry, 'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'>) => void;
        updateMatch: (match: KitTrackerEntry) => void;
        deleteMatch: (date: string) => void;
        addBulkTeamMembers: (data: any[]) => { added: number, skipped: number };
        addBulkMatches: (data: any[]) => { added: number, skipped: number };
    };
}

const DataManagementPanel: React.FC<DataManagementPanelProps> = ({ teamMembers, kitTracker, actions }) => {
    const [editingMember, setEditingMember] = useState<TeamMember | typeof EMPTY_MEMBER | null>(null);
    const [editingMatch, setEditingMatch] = useState<KitTrackerEntry | typeof EMPTY_MATCH | null>(null);

    const handleMemberSave = (memberToSave: TeamMember | typeof EMPTY_MEMBER) => {
        if ('MemberID' in memberToSave) {
            actions.updateTeamMember(memberToSave as TeamMember);
        } else {
            actions.addTeamMember(memberToSave);
        }
        setEditingMember(null);
    };

    const handleMatchSave = (matchToSave: KitTrackerEntry | typeof EMPTY_MATCH) => {
        if ('Status' in matchToSave) {
            actions.updateMatch(matchToSave as KitTrackerEntry);
        } else {
            actions.addMatch(matchToSave);
        }
        setEditingMatch(null);
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-8">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-200 dark:border-blue-500/50">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Welcome to Master Data Management</h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">This panel allows you to directly manage the core data of the application. Use the tables below to add, edit, or delete team members and match schedules. You can also use the CSV upload tools for bulk data entry.</p>
            </div>
            
            {/* CSV Uploader */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                 <h3 className="text-xl font-bold mb-4">Bulk Data Upload</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CsvUploadSection 
                        title="Team Members"
                        templateContent={MEMBER_CSV_TEMPLATE}
                        templateFileName="team_members_template.csv"
                        onUpload={actions.addBulkTeamMembers}
                    />
                    <CsvUploadSection 
                        title="Match Schedules"
                        templateContent={MATCH_CSV_TEMPLATE}
                        templateFileName="match_schedules_template.csv"
                        onUpload={actions.addBulkMatches}
                    />
                 </div>
            </div>

            {/* Member Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Team Members</h3><button onClick={() => setEditingMember(EMPTY_MEMBER)} className={`${buttonClass} bg-brand-primary hover:bg-brand-secondary`}>Add New Member</button></div>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th className="px-4 py-2">Order</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Username</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-center">Actions</th></tr></thead>
                    <tbody>{teamMembers.sort((a,b) => {
                        if (a.CompletedInRound && !b.CompletedInRound) return -1;
                        if (!a.CompletedInRound && b.CompletedInRound) return 1;
                        return a.Order - b.Order;
                    }).map(m => (<tr key={m.MemberID} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2 font-mono">{m.Order}</td><td className="px-4 py-2 font-medium">{m.Name}</td><td className="px-4 py-2">{m.username}</td><td className="px-4 py-2">{m.Role}</td><td className="px-4 py-2">{m.Status}</td>
                        <td className="px-4 py-2 text-center flex items-center justify-center space-x-2"><button onClick={() => setEditingMember(m)} className="text-blue-600 hover:text-blue-800 p-1" aria-label={`Edit ${m.Name}`}><PencilIcon /></button><button onClick={() => window.confirm(`Are you sure you want to delete ${m.Name}?`) && actions.deleteTeamMember(m.MemberID)} className="text-red-600 hover:text-red-800 p-1" aria-label={`Delete ${m.Name}`}><TrashIcon /></button></td></tr>))}</tbody>
                </table></div>
            </div>

            {/* Match Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Match Schedules</h3><button onClick={() => setEditingMatch(EMPTY_MATCH)} className={`${buttonClass} bg-brand-primary hover:bg-brand-secondary`}>Add New Match</button></div>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Cutoff</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-center">Actions</th></tr></thead>
                    <tbody>{kitTracker.sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).map(k => {
                        
                        let displayStatus: KitStatus | 'Match Day' = k.Status;
                        if (k.Status === KitStatus.Upcoming && k.Date === today) {
                            displayStatus = 'Match Day';
                        }
                        
                        return (<tr key={k.Date} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2 font-medium">{k.Date}</td><td className="px-4 py-2">{k.CutoffTime}</td><td className="px-4 py-2"><StatusBadge status={displayStatus} /></td>
                        <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                            <button onClick={() => setEditingMatch(k)} className="text-blue-600 hover:text-blue-800 p-1" aria-label={`Edit match on ${k.Date}`}><PencilIcon /></button>
                            <button onClick={() => window.confirm(`Are you sure you want to delete match on ${k.Date}?`) && actions.deleteMatch(k.Date)} className="text-red-600 hover:text-red-800 p-1" aria-label={`Delete match on ${k.Date}`}><TrashIcon /></button>
                        </td>
                    </tr>);
                    })}
                    </tbody>
                </table></div>
            </div>

            {editingMember && (
                <MemberEditModal member={editingMember} onSave={handleMemberSave} onClose={() => setEditingMember(null)} />
            )}

            {editingMatch && (
                <MatchEditModal match={editingMatch} onSave={handleMatchSave} onClose={() => setEditingMatch(null)} />
            )}
        </div>
    );
};

export default DataManagementPanel;