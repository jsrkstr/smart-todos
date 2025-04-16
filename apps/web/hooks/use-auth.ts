
export function useAuth()  {

    // Login function
    const login = async (email: string, password: string) => {
        const response = await fetch('/api/auth/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }
        return await response.json();
    };

    // Login with provider (Google, Telegram, etc.)
    const loginWithProvider = async (provider: string) => {
        try {
            // Redirect to provider auth endpoint
            if (provider.toLowerCase() === 'google') {
                window.location.href = '/api/auth/google';
            } else if (provider.toLowerCase() === 'telegram') {
                window.location.href = '/api/auth/telegram';
            }
        } catch (error) {
            console.error(`${provider} login error:`, error);
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };
    return {
        login,
        loginWithProvider,
        logout,
    };
} 