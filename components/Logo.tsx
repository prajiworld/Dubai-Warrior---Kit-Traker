import React from 'react';

const DubaiWarriorLogo: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
                <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style={{stopColor: 'rgb(251, 146, 60)', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: 'rgb(234, 88, 12)', stopOpacity: 1}} />
                </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="58" fill="url(#grad1)" />
            <g transform="translate(10, 5)">
                {/* Knight silhouette */}
                <path d="M 50 15 
                         C 40 20, 35 40, 40 50 
                         L 45 70 
                         L 55 70 
                         L 60 50 
                         C 65 40, 60 20, 50 15 Z" fill="#E5E7EB" />
                <path d="M50 12 Q 55 8 60 10 T 70 14" stroke="#E5E7EB" strokeWidth="2" fill="none" />
                <path d="M58 35 L 75 35 L 70 40 Z" fill="#E5E7EB" />
                {/* Lance */}
                <line x1="20" y1="100" x2="100" y2="20" stroke="#E5E7EB" strokeWidth="3" />
                {/* Shield */}
                <path d="M 30 70 
                         C 30 75, 25 100, 50 105 
                         C 75 100, 70 75, 70 70 Z" 
                      fill="white" stroke="#B0B0B0" strokeWidth="1" />
                <path d="M 35 80 L 50 90 L 65 80" stroke="#F97316" strokeWidth="6" fill="none" strokeLinejoin="round" />
                <text x="50" y="100" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#4A2511">DW</text>
            </g>
        </svg>
    </div>
);
export default DubaiWarriorLogo;
