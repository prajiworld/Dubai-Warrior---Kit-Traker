import React, { useState } from 'react';
import type { TeamMember } from '../types';
import { UserCircleIcon } from './Icons';

interface UserProfileProps {
  currentUser: TeamMember;
  onUpdateProfile: (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => void;
  onChangePassword: (passwords: { current: string; new: string }) => { success: boolean; message: string };
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, onUpdateProfile, onChangePassword, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState(currentUser.PhoneNumber);
  const [ownsCar, setOwnsCar] = useState(currentUser.OwnsCar);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    setHasChanges(true);
  };

  const handleOwnsCarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnsCar(e.target.checked);
    setHasChanges(true);
  };
  
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      PhoneNumber: phoneNumber,
      OwnsCar: ownsCar,
    });
    setHasChanges(false);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordData.new !== passwordData.confirm) {
        setPasswordMessage({ type: 'error', text: "New passwords do not match." });
        return;
    }
    if (passwordData.new.length < 6) {
        setPasswordMessage({ type: 'error', text: "Password must be at least 6 characters long." });
        return;
    }

    const result = onChangePassword({ current: passwordData.current, new: passwordData.new });

    if (result.success) {
        setPasswordMessage({ type: 'success', text: result.message });
        setPasswordData({ current: '', new: '', confirm: '' }); // Clear fields on success
    } else {
        setPasswordMessage({ type: 'error', text: result.message });
    }
  };
  
  const inputClass = "block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="flex items-center space-x-4 mb-6">
        <UserCircleIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
        <div>
          <h2 className="text-3xl font-bold">{currentUser.Name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{currentUser.Role}</p>
        </div>
      </div>
      
      {/* Profile Info Form */}
      <form onSubmit={handleProfileSave} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
        <div>
          <label htmlFor="phoneNumber" className={labelClass}>
            Phone Number
          </label>
          <div className="mt-1">
            <input type="tel" name="phoneNumber" id="phoneNumber" className={inputClass} value={phoneNumber} onChange={handlePhoneNumberChange} />
          </div>
        </div>
        
        <div>
            <div className="relative flex items-start">
                <div className="flex items-center h-5">
                    <input id="ownsCar" name="ownsCar" type="checkbox" checked={ownsCar} onChange={handleOwnsCarChange} disabled={!currentUser.IsAdmin} className="focus:ring-brand-accent h-4 w-4 text-brand-primary border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="ownsCar" className={`font-medium text-gray-700 dark:text-gray-300 ${!currentUser.IsAdmin ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                        I own a car
                    </label>
                </div>
            </div>
            {!currentUser.IsAdmin && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Car ownership status can only be changed by an Admin.
                </p>
            )}
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={!hasChanges} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed">
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
        <form onSubmit={handlePasswordSave} className="space-y-4 mt-4">
            <div>
                <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                <div className="mt-1"><input type="password" name="currentPassword" id="currentPassword" className={inputClass} value={passwordData.current} onChange={e => setPasswordData(prev => ({ ...prev, current: e.target.value }))} required /></div>
            </div>
            <div>
                <label htmlFor="newPassword" className={labelClass}>New Password</label>
                <div className="mt-1"><input type="password" name="newPassword" id="newPassword" className={inputClass} value={passwordData.new} onChange={e => setPasswordData(prev => ({ ...prev, new: e.target.value }))} required /></div>
            </div>
            <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                <div className="mt-1"><input type="password" name="confirmPassword" id="confirmPassword" className={inputClass} value={passwordData.confirm} onChange={e => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))} required /></div>
            </div>

            {passwordMessage && (
                <p className={`text-sm font-medium ${passwordMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {passwordMessage.text}
                </p>
            )}

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={!passwordData.current || !passwordData.new || !passwordData.confirm} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Update Password
                </button>
            </div>
        </form>
      </div>

      <div className="flex justify-end mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Back to Dashboard
          </button>
      </div>
    </div>
  );
};

export default UserProfile;
