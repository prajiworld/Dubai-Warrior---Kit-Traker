import React, { useState } from 'react';
import { TeamMember, KitTrackerEntry, Penalty } from '../types';
import DashboardShell from './DashboardShell';
import AdminPanel from './AdminPanel';
import UserPanel from './UserPanel';
import LoginPage from './LoginPage';
import SignUpPage from './SignUpPage';
import ForgotPasswordModal from './ForgotPasswordModal';
import MasterDataPage from './MasterDataPage';
import AuctionPlatform from './DWAuctionPlatform';

interface DWAuctionPlatformGateProps {
  teamMembers: TeamMember[];
  kitTracker: KitTrackerEntry[];
  penalizedPlayers: Penalty[];
}

const DWAuctionPlatformGate: React.FC<DWAuctionPlatformGateProps> = ({ teamMembers, kitTracker, penalizedPlayers }) => {
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [currentPage, setCurrentPage] = useState('login'); // login, signup, forgot, dashboard
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

    const handleLogin = (username: string) => {
        const user = teamMembers.find(m => m.username === username);
        if (user) {
            setCurrentUser(user);
            setCurrentPage('dashboard');
        } else {
            alert('User not found');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('login');
    };

    const handleNavigate = (page: string) => {
        setCurrentPage(page);
    };

    const renderContent = () => {
        if (!currentUser) {
            switch (currentPage) {
                case 'login':
                    return <LoginPage onLogin={handleLogin} onForgotPassword={() => setCurrentPage('forgot')} onSignUp={() => setCurrentPage('signup')} />;
                case 'signup':
                    return <SignUpPage onSignUp={() => setCurrentPage('login')} onLogin={() => setCurrentPage('login')} />;
                case 'forgot':
                    return <ForgotPasswordModal onClose={() => setCurrentPage('login')} />;
                default:
                    return <LoginPage onLogin={handleLogin} onForgotPassword={() => setCurrentPage('forgot')} onSignUp={() => setCurrentPage('signup')} />;
            }
        }

        return (
            <DashboardShell 
                currentUser={currentUser} 
                penalizedPlayers={penalizedPlayers}
                onLogout={handleLogout} 
                onNavigate={handleNavigate}
            >
                {renderPage(currentPage)}
            </DashboardShell>
        );
    };

    const renderPage = (page: string) => {
        switch (page) {
            case 'dashboard':
                return currentUser.IsAdmin 
                    ? <AdminPanel teamMembers={teamMembers} kitTracker={kitTracker} penalizedPlayers={penalizedPlayers} /> 
                    : <UserPanel currentUser={currentUser} kitTracker={kitTracker} penalizedPlayers={penalizedPlayers} />;
            case 'auction':
                return <AuctionPlatform teamMembers={teamMembers} />;
            default:
                return <p>Page not found</p>;
        }
    };

    return <div>{renderContent()}</div>;
};

export default DWAuctionPlatformGate;
