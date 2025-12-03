import React from 'react';
import { useSlotGame } from '../hooks/useSlotGame';
import './SlotGrid.css';

const SlotGrid: React.FC = () => {
    const { grid, spinResult } = useSlotGame();

    return (
        <div className="slot-grid">
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="slot-row">
                    {row.map((symbol, colIndex) => (
                        <div key={colIndex} className="slot-symbol">
                            {spinResult && spinResult[rowIndex][colIndex] ? (
                                <img src={spinResult[rowIndex][colIndex].image} alt={symbol} />
                            ) : (
                                <div className="placeholder" />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default SlotGrid;