export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters
  if (password.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters long",
    };
  }
  return { valid: true, message: "" };
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone);
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const validateRequired = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: "Must be a valid number" };
  }
  if (min !== null && num < min) {
    return { valid: false, message: `Must be at least ${min}` };
  }
  if (max !== null && num > max) {
    return { valid: false, message: `Must be at most ${max}` };
  }
  return { valid: true, message: "" };
};

export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, allowPast = true } = options;
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { valid: false, message: "Invalid date" };
  }

  if (!allowPast && dateObj < new Date()) {
    return { valid: false, message: "Date cannot be in the past" };
  }

  if (minDate && dateObj < new Date(minDate)) {
    return { valid: false, message: `Date must be after ${minDate}` };
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return { valid: false, message: `Date must be before ${maxDate}` };
  }

  return { valid: true, message: "" };
};

export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const value = formData[field];
    const fieldRules = rules[field];

    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = "This field is required";
      return;
    }

    if (fieldRules.email && value && !validateEmail(value)) {
      errors[field] = "Invalid email address";
      return;
    }

    if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
      errors[field] = `Must be at least ${fieldRules.minLength} characters`;
      return;
    }

    if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
      errors[field] = `Must be at most ${fieldRules.maxLength} characters`;
      return;
    }

    if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.patternMessage || "Invalid format";
      return;
    }

    if (fieldRules.custom && value) {
      const result = fieldRules.custom(value, formData);
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
