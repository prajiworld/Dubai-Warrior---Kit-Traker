import React from 'react';

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
    </svg>
);

export const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);

export const ClipboardDocumentListIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.938-2.062 2.063v7.5c0 1.125.938 2.063 2.063 2.063h9.25c1.125 0 2.063-.938 2.063-2.063v-7.5c0-1.125-.938-2.063-2.063-2.063H8.25z" />
    </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.144-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.057-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export const DocumentArrowUpIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.75 13.96c.25.41.41.86.41 1.35 0 1.5-1.23 2.72-2.75 2.72-.82 0-1.55-.38-2.03-.98l-.01-.01c-.48-.6-.95-1.22-1.39-1.84l-.01-.02c-.49-.69-1.02-1.42-1.48-2.08l-.01-.02c-.44-.64-.81-1.23-1.1-1.75l-.02-.03c-.28-.51-.49-1-.6-1.42l-.01-.04c-.11-.42-.12-.82-.01-1.19.11-.37.33-.7.63-.97.28-.25.6-.43.95-.5.35-.07.71-.03 1.03.11.32.14.61.38.82.68l.02.03c.21.3.33.6.36.87.03.27-.03.55-.16.83l-.01.02c-.13.28-.3.56-.5.85l-.02.03c-.2.29-.41.59-.62.9l-.02.03c-.21.3-.4.57-.55.8l-.01.02c-.15.23-.25.42-.3.55l-.01.02c-.05.13-.04.2,0 .22 0 .02.02.05.05.1l.01.02c.03.05.08.11.15.2l.01.01c.07.09.16.2.29.35l.02.02c.13.15.28.31.47.49l.02.02c.19.18.4.37.64.57l.02.01c.24.2.49.4.75.59l.02.01c.26.19.52.36.78.52l.03.01c.26.16.52.3.75.41l.03.01c.23.11.45.19.64.25l.03.01c.19.06.37.09.52.1l.03.01c.15.01.29,0,.41-.03h.01c.12-.03.24-.07.35-.15l.02-.01c.11-.08.22-.18.33-.29l.01-.01c.11-.11.22-.23.33-.37l.01-.02c.11-.14.21-.28.3-.43l.01-.02c.09-.15.17-.3.23-.44l.01-.02c.06-.14.11-.29.15-.43l.01-.02c.04-.14.07-.28.09-.42l.01-.03c.02-.14.03-.28.03-.41 0-.14-.02-.28-.05-.42l-.01-.03c-.03-.14-.07-.28-.13-.43l-.01-.02c-.06-.15-.13-.29-.22-.44l-.01-.01c-.09-.15-.19-.3-.3-.44l-.01-.01c-.11-.14-.23-.28-.36-.42l-.01-.01c-.13-.14-.27-.27-.42-.39l-.01-.01c-.13-.12-.27-.24-.41-.35l-.01-.01c-.14-.11-.29-.21-.44-.3l-.02-.01c-.15-.09-.3-.17-.45-.24l-.02-.01c-.15-.07-.3-.13-.44-.19l-.02-.01c-.14-.06-.28-.11-.41-.15l-.02-.01c-.13-.04-.26-.08-.38-.1l-.02,0c-.12-.02-.24-.04-.35-.05-.11,0-.22-.01-.32-.01-.1,0-.2,0-.29,0h-.01c-.09,0-.19,0-.28.02l-.01,0c-.09.02-.19.04-.28.07l-.01,0c-.09.03-.18.06-.27.1l-.01,0c-.09.04-.18.08-.26.13l-.01,0c-.08.05-.17.1-.25.16l-.01,0c-.08.06-.16.12-.23.18l-.01,0c-.07.06-.14.12-.21.19l-.01.01c-.07.07-.13.13-.19.2l-.01.01c-.06.07-.12.14-.17.21l-.01.01c-.05.07-.1.15-.15.23l-.01.01c-.05.08-.09.16-.13.24l-.01.02c-.04.08-.08.16-.11.24l-.01.02c-.03.08-.06.16-.08.24l-.01.02c-.02.08-.04.16-.05.23l-.01.02c-.01.07,0,.15,0,.22v.02c0,.07.01.15.03.22l.01.02c.02.07.04.15.07.22l.01.02c.03.07.06.15.1.22l.01.02c.04.07.08.15.12.22l.01.02c.04.07.09.14.14.21l.01.01c.05.07.1.14.16.21l.01.01c.06.07.12.13.18.2l.01.01c.06.07.13.13.2.19l.01.01c.2.2.41.39.64.57l.02.02c.23.18.47.35.72.51l.02.01c.25.16.5.3.75.43l.02.01c.25.13.5.24.73.34l.02.01c.23.1.45.18.66.25l.02.01c.21.07.4.12.58.16l.02.01c.18.04.34.06.49.07.15.01.29,0,.41-.03Z" />
    </svg>
);