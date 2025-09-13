
import React, { useState, useMemo, useCallback } from 'react';
import type { TeamMember, KitTrackerEntry, Arrival } from '../types';
import { getDistanceInMeters, formatDate, formatTime } from '../utils/helpers';
import { CheckCircleIcon, MapPinIcon, ClockIcon, XCircleIcon } from './Icons';
import StatusBadge from './StatusBadge';

interface UserPanelProps {
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  kitTracker: KitTrackerEntry[];
  arrivals: Arrival[];
  onCheckIn: (arrivalId: string, location: { lat: number; lng: number; }) => void;
  onWhatsAppCaptain: () => void;
}

// Sub-component for My Check-In View
const MyCheckInView: React.FC<Omit<UserPanelProps, 'teamMembers' | 'kitTracker' | 'arrivals'> & { todayMatch?: KitTrackerEntry, myArrivalToday?: Arrival }> = ({ currentUser, todayMatch, myArrivalToday, onCheckIn, onWhatsAppCaptain }) => {
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const handleCheckIn = useCallback(() => {
        if (!myArrivalToday) return;
        setIsCheckingIn(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onCheckIn(myArrivalToday.ArrivalID, { lat: latitude, lng: longitude });
                setIsCheckingIn(false);
            },
            (error) => {
                setLocationError(`Error getting location: ${error.message}. Please enable location services.`);
                setIsCheckingIn(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [myArrivalToday, onCheckIn]);
    
    const [distance, isWithinGeofence] = useMemo(() => {
        if (myArrivalToday?.CheckInLatLong && todayMatch?.GroundLatLong) {
            const dist = getDistanceInMeters(myArrivalToday.CheckInLatLong.lat, myArrivalToday.CheckInLatLong.lng, todayMatch.GroundLatLong.lat, todayMatch.GroundLatLong.lng);
            return [dist, dist <= todayMatch.GeoRadiusMeters];
        }
        return [null, false];
    }, [myArrivalToday, todayMatch]);

    if (!todayMatch || !myArrivalToday) {
        return <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">No match scheduled for today.</div>
    }
    
    const isLate = myArrivalToday.ArrivalTime ? (new Date(myArrivalToday.ArrivalTime) > new Date(`${todayMatch.Date}T${todayMatch.CutoffTime}`)) : false;
    const hasCheckedIn = !!myArrivalToday.ArrivalTime;
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">My Check-In: {formatDate(todayMatch.Date)}</h3>
            { !todayMatch.MatchOn ? (
                <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300">
                    <p className="font-bold">Match Not Started</p>
                    <p>The admin has not started the match yet. Check-in is disabled.</p>
                </div>
            ) : hasCheckedIn ? (
                <div className="space-y-4">
                    <div className="flex items-center text-status-green font-semibold">
                        <CheckCircleIcon className="w-8 h-8 mr-3"/>
                        <div>
                            <p className="text-lg">You have checked in!</p>
                            <p>Arrival Time: {formatTime(myArrivalToday.ArrivalTime)}</p>
                        </div>
                    </div>
                     {isLate && <div className="p-2 text-sm text-center font-bold text-red-800 bg-red-200 rounded-md">You were marked as LATE.</div>}
                    <div className={`flex items-center p-2 rounded-md ${isWithinGeofence ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <MapPinIcon className="w-5 h-5 mr-2"/>
                        <span>Distance from ground: {distance?.toFixed(0) ?? 'N/A'} meters</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={handleCheckIn} disabled={isCheckingIn || !todayMatch.MatchOn} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                        {isCheckingIn ? "Getting Location..." : "I'm Here (Check In)"}
                    </button>
                    <button onClick={onWhatsAppCaptain} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition duration-300">
                        WhatsApp Captain (Running Late)
                    </button>
                    {locationError && <p className="text-red-500 text-sm mt-2">{locationError}</p>}
                </div>
            )}
        </div>
    );
};

// Sub-component for My Status Today View
const MyStatusTodayView: React.FC<{ teamMembers: TeamMember[]; todayMatch?: KitTrackerEntry }> = ({ teamMembers, todayMatch }) => {
    if (!todayMatch) return null;
    
    const provisional = teamMembers.find(m => m.MemberID === todayMatch.ProvisionalAssignee);
    const responsible = teamMembers.find(m => m.MemberID === todayMatch.KitResponsible);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Today's Kit Status</h3>
                <StatusBadge status={todayMatch.Status} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kit Duty (Provisional)</p>
                    <p className="font-bold text-lg">{provisional?.Name || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kit Responsible</p>
                    <p className="font-bold text-lg">{responsible?.Name || 'Not Decided'}</p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Arrival Cutoff</p>
                    <p className="font-bold text-lg">{todayMatch.CutoffTime}</p>
                </div>
            </div>
        </div>
    );
};

// Sub-component for My History View
const MyHistoryView: React.FC<{ myArrivals: Arrival[]; kitTracker: KitTrackerEntry[]; }> = ({ myArrivals, kitTracker }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">My Arrival History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="py-2">Date</th>
                            <th className="py-2">Arrival Time</th>
                            <th className="py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myArrivals.sort((a,b) => new Date(b.MatchDate).getTime() - new Date(a.MatchDate).getTime()).map(arrival => {
                            const match = kitTracker.find(k => k.Date === arrival.MatchDate);
                            const isLate = arrival.ArrivalTime && match ? (new Date(arrival.ArrivalTime) > new Date(`${match.Date}T${match.CutoffTime}`)) : false;
                            
                            return (
                                <tr key={arrival.ArrivalID} className="border-b dark:border-gray-700">
                                    <td className="py-3">{formatDate(arrival.MatchDate)}</td>
                                    <td className="py-3">{formatTime(arrival.ArrivalTime)}</td>
                                    <td className="py-3">
                                        {arrival.ArrivalTime ? (
                                            isLate ? <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Late</span>
                                                   : <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">On Time</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Not Checked In</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserPanel: React.FC<UserPanelProps> = (props) => {
    const { currentUser, arrivals, kitTracker } = props;

    // Derived State ("Slices" from AppSheet spec)
    const todayMatch = useMemo(() => {
        const sortedMatches = [...kitTracker]
            .filter(k => new Date(k.Date) >= new Date(new Date().toDateString())) // Matches from today onwards
            .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        return sortedMatches[0];
    }, [kitTracker]);

    const myArrivalToday = useMemo(() => 
        todayMatch ? arrivals.find(a => a.MatchDate === todayMatch.Date && a.Member === currentUser.MemberID) : undefined
    , [arrivals, todayMatch, currentUser.MemberID]);

    const myArrivals = useMemo(() => 
        arrivals.filter(a => a.Member === currentUser.MemberID)
    , [arrivals, currentUser.MemberID]);

    return (
        <div className="space-y-6">
            <MyCheckInView {...props} todayMatch={todayMatch} myArrivalToday={myArrivalToday} />
            <MyStatusTodayView {...props} todayMatch={todayMatch} />
            <MyHistoryView myArrivals={myArrivals} kitTracker={kitTracker} />
        </div>
    );
};

export default UserPanel;
