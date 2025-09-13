import React, { useState } from 'react';
import type { TeamMember, KitTrackerEntry } from '../types';
import { MemberStatus, KitStatus } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface KitRotationSchedulePanelProps {
    teamMembers: TeamMember[];
    kitTracker: KitTrackerEntry[];
}

// A simple function to get the next N members in rotation
const getNextInRotation = (members: TeamMember[], lastCompletedOrder: number, count: number): TeamMember[] => {
    const eligibleMembers = members
        .filter(m => m.Status === MemberStatus.Active && m.RotationEligible === 'Yes')
        .sort((a, b) => a.Order - b.Order);

    if (eligibleMembers.length === 0) return [];
    
    // Find the index of the member with the last completed order, or the closest one if not found
    let startIndex = eligibleMembers.findIndex(m => m.Order > lastCompletedOrder);
    if (startIndex === -1) {
        startIndex = 0; // Wrap around
    }
    
    const rotation = [];
    for (let i = 0; i < eligibleMembers.length && rotation.length < count; i++) {
        const member = eligibleMembers[(startIndex + i) % eligibleMembers.length];
        rotation.push(member);
    }
    
    return rotation;
};

const KitRotationSchedulePanel: React.FC<KitRotationSchedulePanelProps> = ({ teamMembers, kitTracker }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [summary, setSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Find the last completed match to determine who was last responsible
    const lastCompletedMatch = kitTracker
        .filter(k => k.Status === KitStatus.Completed && k.KitResponsible)
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];

    const lastResponsibleMember = teamMembers.find(m => m.MemberID === lastCompletedMatch?.KitResponsible);
    const lastCompletedOrder = lastResponsibleMember ? lastResponsibleMember.Order : 0;
    
    const nextRotation = getNextInRotation(teamMembers, lastCompletedOrder, 10);
    
    // Gemini AI Summary Generation
    const generateSummary = async () => {
        setIsGenerating(true);
        setSummary('');
        try {
            // FIX: Initialize GoogleGenAI with API key from environment variables.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const rotationText = nextRotation.map((m, i) => `${i + 1}. ${m.Name}`).join('\n');
            const prompt = `Based on the following upcoming kit rotation schedule for the Dubai Warriors football team, write a friendly and concise summary paragraph. Mention the next 3 people in line by name. The schedule is:\n\n${rotationText}`;
            
            // FIX: Call generateContent with model and contents.
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            // FIX: Access the 'text' property for the response.
            setSummary(response.text);

        } catch (error) {
            console.error("Error generating summary with Gemini:", error);
            alert("Failed to generate summary. Please check the console for details.");
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <button
                className="w-full flex justify-between items-center text-left"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 className="text-xl font-bold">Kit Rotation Forecast</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View the upcoming order for kit duty assignments.</p>
                </div>
                {isExpanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
            </button>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Next 10 in Rotation:</h4>
                            {nextRotation.length > 0 ? (
                                <ol className="list-decimal list-inside space-y-2">
                                    {nextRotation.map((member, index) => (
                                        <li key={member.MemberID} className="flex items-center">
                                            <span className={`font-mono text-xs mr-3 inline-flex items-center justify-center h-6 w-6 rounded-full ${index < 3 ? 'bg-brand-primary text-white font-bold' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                {index + 1}
                                            </span>
                                            {member.Name}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-sm text-gray-500">No eligible members found for rotation.</p>
                            )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                             <h4 className="font-semibold mb-2">AI-Powered Summary</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Use Gemini to generate a quick summary of the upcoming rotation.</p>
                             {summary && !isGenerating && (
                                <div className="prose prose-sm dark:prose-invert bg-white dark:bg-gray-800 p-3 rounded-md shadow-inner">
                                    <p>{summary}</p>
                                </div>
                             )}
                             {isGenerating && <p className="text-sm text-brand-primary animate-pulse">Generating summary...</p>}
                             <button
                                onClick={generateSummary}
                                disabled={isGenerating}
                                className="mt-3 w-full px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-md hover:bg-brand-primary disabled:bg-gray-400"
                             >
                                 {isGenerating ? 'Working...' : 'Generate with Gemini'}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KitRotationSchedulePanel;
