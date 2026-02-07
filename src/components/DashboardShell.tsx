import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TeamMember, Penalty } from '../types';
import {
    HomeIcon, LogoutIcon, MenuIcon, XIcon, DatabaseIcon, UserCircleIcon
} from './Icons';

interface DashboardShellProps {
    currentUser: TeamMember | null;
    penalizedPlayers?: Penalty[]; // Made optional
    onLogout: () => void;
    children: ReactNode;
}

const NavLink: React.FC<{ 
    onClick: () => void; 
    children: ReactNode; 
    current: boolean; 
    isMobile?: boolean; 
    count?: number;
}> = ({ onClick, children, current, isMobile, count }) => {
    const baseClasses = isMobile 
        ? 'block px-3 py-2 rounded-md text-base font-medium'
        : 'relative px-3 py-2 rounded-md text-sm font-medium';
    const stateClasses = current
        ? 'bg-gray-900 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white';

    return (
        <div onClick={onClick} className={`${baseClasses} ${stateClasses} cursor-pointer flex items-center`}>
            {children}
            {count !== undefined && count > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 bg-red-600 text-white text-xs rounded-full">{count}</span>
            )}
        </div>
    );
};

const DashboardShell: React.FC<DashboardShellProps> = ({ currentUser, penalizedPlayers = [], onLogout, children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    const navigation = [
        { name: 'Kit Tracker', path: '/', icon: HomeIcon, count: 0 },
        { name: 'Master Data', path: '/master-data', icon: DatabaseIcon, count: 0 },
    ];
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <nav className="bg-brand-primary dark:bg-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 text-white font-bold text-xl cursor-pointer" onClick={() => handleNavigation('/')}>
                                DW KitTracker
                            </div>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    {navigation.map((item) => (
                                        <NavLink 
                                            key={item.name} 
                                            onClick={() => handleNavigation(item.path)} 
                                            current={location.pathname === item.path}
                                            count={item.count}
                                        >
                                            <item.icon className="h-5 w-5 mr-2" /> 
                                            {item.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-4 flex items-center md:ml-6">
                                <button className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"  onClick={() => handleNavigation('/profile')}>
                                    <UserCircleIcon className="h-8 w-8" />
                                </button>
                                <span className="text-white ml-3 mr-4">Welcome, {currentUser?.Name}</span>
                                <button onClick={onLogout} className="p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                                    <LogoutIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="-mr-2 flex md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                                {mobileMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navigation.map((item) => (
                                <NavLink 
                                    key={item.name} 
                                    onClick={() => handleNavigation(item.path)} 
                                    current={location.pathname === item.path}
                                    isMobile={true}
                                    count={item.count}
                                >
                                    <item.icon className="h-5 w-5 mr-3" /> 
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-700">
                            <div className="flex items-center px-5">
                                <div className="flex-shrink-0">
                                    <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${currentUser?.Name?.replace(' ', '+') || 'User'}&background=random`} alt="" />
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium leading-none text-white">{currentUser?.Name}</div>
                                    <div className="text-sm font-medium leading-none text-gray-400">{currentUser?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <button
                                    onClick={() => handleNavigation('/profile')}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                                >
                                <UserCircleIcon className="h-6 w-6 mr-3 inline"/> Profile
                                </button>
                                <button
                                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                                >
                                <LogoutIcon className="h-6 w-6 mr-3 inline"/> Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardShell;
