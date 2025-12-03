import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'classic', name: 'Classic', displayName: 'Classic Red' },
        { id: 'neon', name: 'Neon', displayName: 'Neon Purple' },
        { id: 'gold', name: 'Gold', displayName: 'Golden Fortune' },
        { id: 'ocean', name: 'Ocean', displayName: 'Ocean Blue' },
    ];

    const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setTheme(event.target.value);
    };

    return (
        <div className="theme-selector" style={{ padding: '20px', textAlign: 'center' }}>
            <label htmlFor="theme-select" style={{ marginRight: '10px', color: 'white', fontSize: '1.1rem' }}>
                Select Theme:
            </label>
            <select 
                id="theme-select" 
                value={theme} 
                onChange={handleThemeChange}
                style={{ 
                    padding: '10px 20px', 
                    fontSize: '1rem', 
                    borderRadius: '8px',
                    border: '2px solid #f39c12',
                    background: 'white',
                    cursor: 'pointer'
                }}
            >
                {themes.map((t) => (
                    <option key={t.id} value={t.name.toLowerCase()}>
                        {t.displayName}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ThemeSelector;