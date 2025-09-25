import React, { useState } from 'react';
import type { TeamMember } from '../types';
import { UserCircleIcon } from './Icons';

interface UserProfileProps {
  currentUser: TeamMember;
  onUpdateProfile: (updatedData: Pick<TeamMember, 'PhoneNumber' | 'OwnsCar'>) => void;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, onUpdateProfile, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState(currentUser.PhoneNumber);
  const [ownsCar, setOwnsCar] = useState(currentUser.OwnsCar);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    setHasChanges(true);
  };

  const handleOwnsCarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnsCar(e.target.checked);
    setHasChanges(true);
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      PhoneNumber: phoneNumber,
      OwnsCar: ownsCar,
    });
    setHasChanges(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="flex items-center space-x-4 mb-6">
        <UserCircleIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
        <div>
          <h2 className="text-3xl font-bold">{currentUser.Name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{currentUser.Role}</p>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <div className="mt-1">
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
            />
          </div>
        </div>
        
        <div>
            <div className="relative flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="ownsCar"
                        name="ownsCar"
                        type="checkbox"
                        checked={ownsCar}
                        onChange={handleOwnsCarChange}
                        disabled={!currentUser.IsAdmin}
                        className="focus:ring-brand-accent h-4 w-4 text-brand-primary border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
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


        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!hasChanges}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;