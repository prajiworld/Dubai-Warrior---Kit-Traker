import React, { useState, useEffect } from 'react';
import type { Match, TeamMember } from '@/types';
import { Button } from '@/components/ui/button';

interface MatchEditModalProps {
  match: Match | Omit<Match, 'id'>;
  teamMembers: TeamMember[];
  onSave: (match: Match) => void;
  onClose: () => void;
}

const MatchEditModal: React.FC<MatchEditModalProps> = ({ match, teamMembers, onSave, onClose }) => {
  // Initialize with a default object structure if match is empty
  const [formData, setFormData] = useState<Match>({
    id: 'id' in match ? match.id : '',
    date: match.date || '',
    status: match.status || 'Scheduled',
    assignedPlayer: match.assignedPlayer || '',
    notes: match.notes || ''
  } as Match);
  
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
     setFormData({
        id: 'id' in match ? match.id : '',
        date: match.date || '',
        status: match.status || 'Scheduled',
        assignedPlayer: match.assignedPlayer || '',
        notes: match.notes || ''
      } as Match);
  }, [match]);

  useEffect(() => {
    // Basic validation: Date is required
    const isValid = !!formData.date;
    setIsFormValid(isValid);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Explicitly call onSave if validation passes
    if (isFormValid) {
        // Create a clean object to pass back
        const matchToSave: Match = {
            ...formData,
            // Ensure status is valid
            status: formData.status || 'Scheduled'
        };
        onSave(matchToSave);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {'id' in match && match.id ? 'Edit Match' : 'Add New Match'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Match Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status || 'Scheduled'}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="No Play">No Play</option>
            </select>
          </div>

          <div>
            <label htmlFor="assignedPlayer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign Player
            </label>
            <select
              id="assignedPlayer"
              name="assignedPlayer"
              value={formData.assignedPlayer || ''}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">None</option>
              {teamMembers.map(member => (
                <option key={member.MemberID} value={member.MemberID}>{member.Name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <input
              id="notes"
              name="notes"
              type="text"
              value={formData.notes || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={!isFormValid} onClick={(e) => {
                // Ensure click doesn't bubble, but let submit event fire
                e.stopPropagation(); 
            }}>
                Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchEditModal;
