import React from 'react';

const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z" /><path d="M8 8h8M8 12h8M8 16h3" /></>,
    bank: <><path d="m3 9 9-6 9 6" /><path d="M4 10h16M5 20h14M3 22h18M7 10v9M12 10v9M17 10v9" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    invoice: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h7M9 16h7" /></>,
    alert: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
    wallet: <><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2" /><path d="M6 6V4h12" /></>,
    income: <><path d="M4 17 10 11l4 4 7-8" /><path d="M15 7h6v6" /></>,
    expense: <><path d="m4 7 6 6 4-4 7 8" /><path d="M15 17h6v-6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    currency: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-2.8.8-2.8 2s1.1 1.8 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.4 0-2.5-.4-3.2-1.2M12 5.5v13" /></>,
};

export default function Icon({ name, className = '' }) {
    return (
        <svg
            className={`icon-svg${className ? ` ${className}` : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {paths[name] || paths.info}
        </svg>
    );
}
