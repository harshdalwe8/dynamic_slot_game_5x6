import { useEffect, useState } from 'react';
import { fetchThemes, spinSlot } from '../services/api';

const useSlotGame = () => {
    const [themes, setThemes] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [gameState, setGameState] = useState({
        isSpinning: false,
        result: null,
        error: null,
    });

    useEffect(() => {
        const loadThemes = async () => {
            try {
                const fetchedThemes = await fetchThemes();
                setThemes(fetchedThemes);
                setSelectedTheme(fetchedThemes[0]); // Set default theme
            } catch (error) {
                console.error('Error fetching themes:', error);
            }
        };

        loadThemes();
    }, []);

    const handleSpin = async () => {
        setGameState({ ...gameState, isSpinning: true, error: null });
        try {
            const result = await spinSlot(selectedTheme.id);
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