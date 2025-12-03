import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

export const spinSlot = async (betAmount) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/spin`, { betAmount });
        return response.data;
    } catch (error) {
        throw new Error('Error spinning the slot: ' + error.message);
    }
};

export const getThemes = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/themes`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching themes: ' + error.message);
    }
};

export const selectTheme = async (themeId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/select-theme`, { themeId });
        return response.data;
    } catch (error) {
        throw new Error('Error selecting theme: ' + error.message);
    }
};