// /js/utils/validate.js
function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
}
export const validate = {
    isRequired: (val) => {
        return val !== null && val !== undefined && val.toString().trim().length > 0;
    },
    
    isEmail: (val) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(val).toLowerCase());
    },

    minLength: (val, length) => {
        return val && String(val).trim().length >= length;
    },

    isValidDateRange: (start, end) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        return d2 >= d1;
    },

    // Validates a basic input field and toggles error styling natively
    field: (inputElement, condition, errorMsg) => {
        const formGroup = inputElement.closest('.form-group');
        let errorEl = formGroup.querySelector('.form-error');

        // Setup DOM for error if it doesn't exist
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            formGroup.appendChild(errorEl);
        }

        if (!condition) {
            inputElement.classList.add('is-invalid');
            errorEl.textContent = errorMsg;
            return false;
        } else {
            inputElement.classList.remove('is-invalid');
            errorEl.textContent = '';
            return true;
        }
    }
};
