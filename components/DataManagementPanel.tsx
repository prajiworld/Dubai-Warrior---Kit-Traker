import React, { useState, useEffect } from 'react';
import type { TeamMember, KitTrackerEntry, DWCategory } from '../types';
import { MemberStatus, KitStatus, AssignmentReason, DW_CATEGORIES } from '../types';
import { PencilIcon, TrashIcon, XCircleIcon } from './Icons';
import StatusBadge from './StatusBadge';

const EMPTY_MEMBER: Omit<TeamMember, 'MemberID' | 'CompletedInRound'> = {
  Name: '',
  username: '',
  email: '',
  password: '',
  Role: 'Player',
  IsAdmin: false,
  PhoneNumber: '',
  OwnsCar: false,
  Status: MemberStatus.Active,
  RotationEligible: 'Yes',
  PenaltyEligible: true,
  Order: 1,
  Notes: '',
  DWCategory: DW_CATEGORIES[0],
};

const EMPTY_MATCH: Omit<
  KitTrackerEntry,
  'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'
> = {
  Date: new Date().toISOString().split('T')[0],
  DueDate: new Date().toISOString().split('T')[0],
  GroundLatLong: { lat: 25.0763, lng: 55.1886 },
  GeoRadiusMeters: 250,
  CutoffTime: '22:45',
  Notes: '',
};

const inputClass =
  'block w-full text-sm px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const buttonClass =
  'px-4 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50';

/* ------------------------- Member Edit Modal ------------------------- */

interface MemberEditModalProps {
  member: TeamMember | typeof EMPTY_MEMBER;
  onSave: (member: TeamMember | typeof EMPTY_MEMBER) => void;
  onClose: () => void;
}

const MemberEditModal: React.FC<MemberEditModalProps> = ({ member, onSave, onClose }) => {
  const [formData, setFormData] = useState(member);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(member);
    setEmailError(null);
  }, [member]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'email' && emailError) setEmailError(null);
  };

  const handleCheckboxChange = (field: 'IsAdmin' | 'OwnsCar' | 'PenaltyEligible', checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  // Custom email validator to avoid native messages (no underscores in domain, no consecutive dots, etc.)
  const isValidEmail = (email: string): boolean => {
    const trimmed = (email || '').trim();
    if (!trimmed || !trimmed.includes('@') || trimmed.includes(' ') || trimmed.endsWith('.')) return false;
    if (trimmed.includes('..')) return false;

    const [local, domain] = trimmed.split('@');
    if (!local || !domain) return false;

    if (/[_'",]/.test(domain)) return false; // underscores, quotes, commas not allowed in domain
    if (!domain.includes('.')) return false;

    const labels = domain.split('.');
    const labelRe = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
    if (!labels.every((l) => labelRe.test(l))) return false;

    const tld = labels[labels.length - 1];
    if (!/^[A-Za-z]{2,}$/.test(tld)) return false;

    if (!/^[^@\s]{1,64}$/.test(local)) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    /*
    // Validate email here to prevent native popup (form is noValidate)
    if (!isValidEmail((formData as TeamMember).email)) {
      setEmailError(
        "Please enter a valid email (e.g., ben.kenobi@galaxy.net). Domain can't contain underscores, spaces, quotes, commas, or consecutive dots."
      );
      return;
    }
    */

    onSave(formData);
  };

  const isNewMember = !('MemberID' in formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-lg">{isNewMember ? 'Add New Member' : 'Edit Member'}</h4>
            <button type="button" onClick={onClose} aria-label="Close edit member modal">
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={formData.Name}
                onChange={(e) => handleChange('Name', e.target.value)}
                className={inputClass}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={inputClass}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                // IMPORTANT: avoid native email popup
                type="text"
                inputMode="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass}
                autoComplete="email"
                required
                // keep your disable rule if desired
                disabled={!isNewMember && (formData as TeamMember).password !== 'PLACEHOLDER'}
                placeholder="e.g. ben.kenobi@galaxy.net"
              />
              {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                placeholder={isNewMember ? '' : 'Unchanged'}
                onChange={(e) => handleChange('password', e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                required={isNewMember}
              />
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                value={formData.PhoneNumber}
                onChange={(e) => handleChange('PhoneNumber', e.target.value)}
                className={inputClass}
                autoComplete="tel"
                placeholder="+971501234567"
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <input
                type="text"
                value={formData.Role}
                onChange={(e) => handleChange('Role', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Order</label>
              <input
                type="number"
                value={formData.Order}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  handleChange('Order', Number.isNaN(n) ? 0 : n);
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                value={formData.Status}
                onChange={(e) => handleChange('Status', e.target.value as MemberStatus)}
                className={inputClass}
              >
                {Object.values(MemberStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Rotation Eligible</label>
              <select
                value={formData.RotationEligible}
                onChange={(e) => handleChange('RotationEligible', e.target.value as 'Yes' | 'No')}
                className={inputClass}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>DW Category</label>
              <select
                value={formData.DWCategory}
                onChange={(e) => handleChange('DWCategory', e.target.value as DWCategory)}
                className={inputClass}
              >
                {DW_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.IsAdmin}
                  onChange={(e) => handleCheckboxChange('IsAdmin', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="isAdmin" className="ml-2 text-sm">
                  Is Admin?
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ownsCar"
                  checked={formData.OwnsCar}
                  onChange={(e) => handleCheckboxChange('OwnsCar', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="ownsCar" className="ml-2 text-sm">
                  Owns Car?
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="penalty"
                  checked={formData.PenaltyEligible}
                  onChange={(e) => handleCheckboxChange('PenaltyEligible', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="penalty" className="ml-2 text-sm">
                  Penalty Eligible?
                </label>
              </div>
            </div>

            <div className="col-span-full">
              <label className={labelClass}>Notes</label>
              <textarea
                value={formData.Notes}
                onChange={(e) => handleChange('Notes', e.target.value)}
                className={inputClass}
                rows={2}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>
              Cancel
            </button>
            <button type="submit" className={`${buttonClass} bg-green-600 hover:bg-green-700`}>
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------- Match Edit Modal ------------------------- */

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-lg">{isNewMatch ? 'Add New Match' : 'Edit Match'}</h4>
            <button type="button" onClick={onClose} aria-label="Close edit match modal">
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Match Date</label>
              <input
                type="date"
                value={formData.Date}
                onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
                className={inputClass}
                required
                disabled={!isNewMatch}
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={formData.DueDate}
                onChange={(e) => setFormData({ ...formData, DueDate: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Cutoff Time</label>
              <input
                type="time"
                value={formData.CutoffTime}
                onChange={(e) => setFormData({ ...formData, CutoffTime: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.GroundLatLong.lat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    GroundLatLong: { ...formData.GroundLatLong, lat: parseFloat(e.target.value) },
                  })
                }
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.GroundLatLong.lng}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    GroundLatLong: { ...formData.GroundLatLong, lng: parseFloat(e.target.value) },
                  })
                }
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Geo Radius (m)</label>
              <input
                type="number"
                value={formData.GeoRadiusMeters}
                onChange={(e) => setFormData({ ...formData, GeoRadiusMeters: parseInt(e.target.value, 10) || 0 })}
                className={inputClass}
                required
              />
            </div>

            {!isNewMatch && (
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={(formData as KitTrackerEntry).Status}
                  onChange={(e) => setFormData({ ...formData, Status: e.target.value as KitStatus })}
                  className={inputClass}
                >
                  {Object.values(KitStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-span-full">
              <label className={labelClass}>Notes</label>
              <textarea
                value={formData.Notes}
                onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                className={inputClass}
                rows={2}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}>
              Cancel
            </button>
            <button type="submit" className={`${buttonClass} bg-green-600 hover:bg-green-700`}>
              Save Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------- Data Management Panel ------------------------- */

interface DataManagementPanelProps {
  teamMembers: TeamMember[];
  kitTracker: KitTrackerEntry[];
  actions: {
    addTeamMember: (memberData: Omit<TeamMember, 'MemberID' | 'CompletedInRound'>) => void;
    updateTeamMember: (member: TeamMember) => void;
    deleteTeamMember: (memberId: string) => void;
    addMatch: (
      matchData: Omit<
        KitTrackerEntry,
        'ProvisionalAssignee' | 'KitResponsible' | 'TakenOnBehalfOf' | 'Status' | 'WeeksHeld' | 'MatchOn' | 'Reason' | 'DeferredMemberID'
      >
    ) => void;
    updateMatch: (match: KitTrackerEntry) => void;
    deleteMatch: (date: string) => void;
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
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          This panel allows you to directly manage the core data of the application. Use the tables below to add, edit,
          or delete team members and match schedules.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Team Members</h3>
          <button onClick={() => setEditingMember(EMPTY_MEMBER)} className={`${buttonClass} bg-brand-primary hover:bg-brand-secondary`}>
            Add New Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...teamMembers]
                .sort((a, b) => a.Order - b.Order)
                .map((m) => (
                  <tr key={m.MemberID} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-mono">{m.Order}</td>
                    <td className="px-4 py-2 font-medium">{m.Name}</td>
                    <td className="px-4 py-2">{m.email}</td>
                    <td className="px-4 py-2">{m.Role}</td>
                    <td className="px-4 py-2">{m.Status}</td>
                    <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setEditingMember(m)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        aria-label={`Edit ${m.Name}`}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => window.confirm(`Are you sure you want to delete ${m.Name}?`) && actions.deleteTeamMember(m.MemberID)}
                        className="text-red-600 hover:text-red-800 p-1"
                        aria-label={`Delete ${m.Name}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Match Schedules</h3>
          <button onClick={() => setEditingMatch(EMPTY_MATCH)} className={`${buttonClass} bg-brand-primary hover:bg-brand-secondary`}>
            Add New Match
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Cutoff</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...kitTracker]
                .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
                .map((k) => {
                  let displayStatus: KitStatus | 'Match Day' = k.Status;
                  const today = new Date().toISOString().split('T')[0];
                  if (k.Status === KitStatus.Upcoming && k.Date === today) {
                    displayStatus = 'Match Day';
                  }

                  return (
                    <tr key={k.Date} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 font-medium">{k.Date}</td>
                      <td className="px-4 py-2">{k.CutoffTime}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={displayStatus} />
                      </td>
                      <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setEditingMatch(k)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          aria-label={`Edit match on ${k.Date}`}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => window.confirm(`Are you sure you want to delete match on ${k.Date}?`) && actions.deleteMatch(k.Date)}
                          className="text-red-600 hover:text-red-800 p-1"
                          aria-label={`Delete match on ${k.Date}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
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
