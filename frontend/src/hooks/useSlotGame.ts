import { useEffect, useState } from 'react';
import { getThemes, spinSlot } from '../services/api';

interface Theme {
    id: string;
    name: string;
    displayName?: string;
}

interface GameState {
    isSpinning: boolean;
    result: any;
    error: string | null;
}

const useSlotGame = () => {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
    const [gameState, setGameState] = useState<GameState>({
        isSpinning: false,
        result: null,
        error: null,
    });

    useEffect(() => {
        const loadThemes = async () => {
            try {
                const fetchedThemes = await getThemes();
                setThemes(fetchedThemes);
                setSelectedTheme(fetchedThemes[0]); // Set default theme
            } catch (error) {
                console.error('Error fetching themes:', error);
            }
        };

        loadThemes();
    }, []);

    const handleSpin = async (betAmount: number = 10) => {
        if (!selectedTheme) return;
        
        setGameState({ ...gameState, isSpinning: true, error: null });
        try {
            const result = await spinSlot(betAmount, selectedTheme.id);
            setGameState({ isSpinning: false, result, error: null });
        } catch (error) {
            setGameState({ isSpinning: false, result: null, error: 'Spin failed. Please try again.' });
        }
    };

    return {
        themes,
        selectedTheme,
        setSelectedTheme,
        gameState,
        handleSpin,
    };
};

export default useSlotGame;