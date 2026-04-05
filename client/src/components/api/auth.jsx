import api from './axios';

export const registerUser = async (data) => {
    return api.post('/api/auth/register', data);
}

export const loginUser = async (data) => {
    return api.post('/api/auth/login', data);
}

