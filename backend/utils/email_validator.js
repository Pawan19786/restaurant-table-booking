export const isValidEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

export const isStrongPassword = (password) => {
  // Minimum 6 characters
  return password.length >= 6;
};
