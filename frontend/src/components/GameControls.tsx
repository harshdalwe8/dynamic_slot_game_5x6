import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const GameControls: React.FC<{ onSpin: () => void; betAmount: number; setBetAmount: (amount: number) => void; }> = ({ onSpin, betAmount, setBetAmount }) => {
    const { theme } = useTheme();

    return (
        <div className={`game-controls ${theme}`}>
            <div className="bet-settings">
                <label htmlFor="bet-amount">Bet Amount:</label>
                <input
                    type="number"
                    id="bet-amount"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="1"
                />
            </div>
            <button onClick={onSpin} className="spin-button">
                Spin
            </button>
        </div>
    );
};

export default GameControls;