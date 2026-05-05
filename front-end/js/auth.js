// /js/auth.js
import { db } from './store.js';

class Auth {
    constructor() {
        this.currentUser = this.loadSession();
    }

    loadSession() {
        const session = localStorage.getItem('empTrackSessionV2');
        return session ? JSON.parse(session) : null;
    }

    async login(email, password) {
        // Simple mock authentication using the store users array
        const user = await db.getUserByEmail(email);
        
        if (!user) {
            return { success: false, message: "User not found." };
        }
        
        if (user.password !== password) {
            return { success: false, message: "Invalid password." };
        }
        
        // Remove password from memory session data for security practice
        const { password: _, ...safeUser } = user;
        this.currentUser = safeUser;
        localStorage.setItem('empTrackSessionV2', JSON.stringify(this.currentUser));
        
        return { success: true, user: this.currentUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('empTrackSessionV2');
        window.location.href = '/front-end/index.html';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getRole() {
        if (!this.currentUser) return null;
        return this.currentUser.role;
    }
}

export const auth = new Auth();
