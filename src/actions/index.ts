import { login, register, logout, requestPasswordReset, updatePassword } from './auth';

export const server = {
    auth: {
        login,
        register,
        logout,
        requestPasswordReset,
        updatePassword,
    },
};
