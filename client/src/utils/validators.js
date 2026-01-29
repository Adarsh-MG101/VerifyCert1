/**
 * Global Validation Utility for VerifyCert
 */

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!re.test(email)) return "Please enter a valid email address";
    return null;
};

export const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters long";

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecial) return "Password must contain at least one special character";

    return null;
};

export const validateUsername = (username, maxLen = 20) => {
    if (!username) return "Username is required";
    if (username.length > maxLen) return `Username cannot exceed ${maxLen} characters`;
    if (username.length < 3) return "Username must be at least 3 characters long";
    return null;
};

export const validateForm = (data, rules) => {
    const errors = {};

    if (rules.username) {
        const err = validateUsername(data.username, rules.username.max);
        if (err) errors.username = err;
    }

    if (rules.email) {
        const err = validateEmail(data.email);
        if (err) errors.email = err;
    }

    if (rules.password) {
        const err = validatePassword(password);
        if (err) errors.password = err;
    }

    return errors;
};
