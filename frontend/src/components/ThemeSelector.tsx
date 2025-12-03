import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import './ThemeSelector.css';

const ThemeSelector: React.FC = () => {
    const { themes, selectedTheme, setSelectedTheme } = useContext(ThemeContext);

    const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTheme(event.target.value);
    };

    return (
        <div className="theme-selector">
            <label htmlFor="theme-select">Select Theme:</label>
            <select id="theme-select" value={selectedTheme} onChange={handleThemeChange}>
                {themes.map((theme) => (
                    <option key={theme.id} value={theme.name}>
                        {theme.displayName}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ThemeSelector;