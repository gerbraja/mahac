import { api } from '../api/api';

/**
 * Get the current user's ID from localStorage or fetch from API
 * @returns {Promise<number>} The user ID
 */
export const getUserId = async () => {
    let userId = localStorage.getItem('userId');

    if (!userId) {
        // Fetch from /auth/me if not in localStorage
        const userResponse = await api.get('/auth/me');
        userId = userResponse.data.id;
        localStorage.setItem('userId', userId);
    }

    return parseInt(userId);
};
