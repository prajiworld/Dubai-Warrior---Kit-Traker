
import React, { useState, useEffect } from 'react';
import type { TeamMember } from '@/types';

interface MemberEditModalProps {
  member: TeamMember | Omit<TeamMember, 'MemberID'>;
  onSave: (member: TeamMember | Omit<TeamMember, 'MemberID'>) => void;
  onClose: () => void;
}

const MemberEditModal: React.FC<MemberEditModalProps> = ({ member, onSave, onClose }) => {
  const [formData, setFormData] = useState(member);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const { Name, email } = formData as TeamMember;
    setIsFormValid(!!(Name && email));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | boolean = value;
    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSave(formData);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4">{'MemberID' in member ? 'Edit' : 'Add'} Team Member</h2>
          
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                <input required type="text" name="Name" value={formData.Name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div>
                <label>Email</label>
                <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div>
                <label>Role</label>
                <select name="Role" value={formData.Role || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value="Player">Player</option>
                    <option value="Admin">Admin</option>
                    <option value="Guest">Guest</option>
                </select>
            </div>
            <div>
                <label>Status</label>
                <select name="Status" value={formData.Status || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Banned">Banned</option>
                </select>
            </div>
            <div>
                <label>Rotation</label>
                <select name="RotationEligible" value={formData.RotationEligible || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>
            <div>
                <label className="flex items-center">
                    <input type="checkbox" name="PenaltyEligible" checked={formData.PenaltyEligible || false} onChange={handleChange} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                    <span className="ml-2">Penalty Box</span>
                </label>
            </div>
             <div>
                <label className="flex items-center">
                    <input type="checkbox" name="OwnsCar" checked={formData.OwnsCar || false} onChange={handleChange} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                    <span className="ml-2">Car Owner</span>
                </label>
            </div>
            <div>
                <label>DW Category</label>
                <select name="DWCategory" value={formData.DWCategory || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    <option value="RS (Batsman)">RS (Batsman)</option>
                    <option value="Main (All-Rounder)">Main (All-Rounder)</option>
                    <option value="Middle Order (Batsman)">Middle Order (Batsman)</option>
                    <option value="Middle Order (Bat) & Main (Bowling)">Middle Order (Bat) & Main (Bowling)</option>
                    <option value="RS (All-Rounder)">RS (All-Rounder)</option>
                    <option value="RS (Bat) & Main (Bowl)">RS (Bat) & Main (Bowl)</option>
                    <option value="RS (Bowl) & Middle Order (Bat)">RS (Bowl) & Middle Order (Bat)</option>
                </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Cancel</button>
            <button type="submit" disabled={!isFormValid} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberEditModal;
