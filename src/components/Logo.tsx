
import React from 'react';

const DubaiWarriorLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Dubai Warriors Logo"
    >
        {/* Defs for gradients and filters */}
        <defs>
            <radialGradient id="orange_grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
            </radialGradient>
            <linearGradient id="lance_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#DCDCDC', stopOpacity: 0.8 }} />
            </linearGradient>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
                <feOffset in="blur" dx="1" dy="1" result="offsetBlur"/>
                <feMerge>
                    <feMergeNode in="offsetBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        {/* Swooshes behind */}
        <g opacity="0.5" filter="url(#dropShadow)">
            <path d="M 10,60 C 20,40 30,35 40,40 C 30,50 20,70 10,80 Z" fill="#B0B0B0" />
            <path d="M 90,60 C 80,40 70,35 60,40 C 70,50 80,70 90,80 Z" fill="#B0B0B0" />
        </g>

        {/* Orange Circle */}
        <circle cx="50" cy="45" r="30" fill="url(#orange_grad)" />
        <circle cx="50" cy="45" r="30" fill="white" opacity="0.2" />


        {/* Knight */}
        <g opacity="0.8">
            {/* Body */}
            <path d="M 45,30 L 65,30 L 63,55 L 47,55 Z" fill="#F5F5F5" />
            {/* Head */}
            <path d="M 50,20 C 55,18 60,22 60,28 L 50,30 Z" fill="#F5F5F5" />
            <path d="M 52,24 L 58,24 M 52,26 L 58,26" stroke="#424242" strokeWidth="0.5" />
             {/* Plume */}
            <path d="M 50,20 Q 55,15 60,18" stroke="#F5F5F5" strokeWidth="1" fill="none" />
        </g>

        {/* Lance */}
        <path d="M 25,70 L 85,10" stroke="url(#lance_grad)" strokeWidth="3" strokeLinecap="round"/>

        {/* Shield */}
        <g transform="translate(0, 10)">
            <path d="M 30,50 L 70,50 L 70,75 C 70,85 50,95 50,95 C 30,85 30,75 30,65 Z" fill="white" stroke="#BDBDBD" strokeWidth="1" />
            {/* Chevron */}
            <path d="M 35,60 L 50,70 L 65,60 L 65,65 L 50,75 L 35,65 Z" fill="#FF8C00" />
            {/* DW Logo */}
            <g>
                <circle cx="50" cy="82" r="8" fill="#6D4C41" />
                <text x="44" y="85" fontFamily="sans-serif" fontSize="6" fill="white" fontWeight="bold">D</text>
                <text x="51" y="85" fontFamily="sans-serif" fontSize="6" fill="white" fontWeight="bold">W</text>
            </g>
        </g>
    </svg>
);

export default DubaiWarriorLogo;
