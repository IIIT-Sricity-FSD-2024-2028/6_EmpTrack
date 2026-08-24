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
        // Credentials are verified server-side (POST /auth/login), which also resolves
        // the account's role - platform-level (Super Admin, Platform Admin, Support
        // Member, Technical Member) or company-level (Company Admin, HR, Team Lead,
        // Employee). The frontend never decides the role itself.
        try {
            const { user } = await db.login(email, password);
            this.currentUser = user;
            localStorage.setItem('empTrackSessionV2', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        } catch (e) {
            return { success: false, message: e.message || 'Invalid email or password.' };
        }
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

