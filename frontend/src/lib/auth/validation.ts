
export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export function validateRegisterForm(
  data: RegisterFormData,
): string | null {
  if (!data.name.trim()) {
    return "Please enter your full name.";
  }

  if (!data.email.trim()) {
    return "Please enter your email address.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return "Please enter a valid email address.";
  }

  if (data.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (data.password !== data.passwordConfirmation) {
    return "Passwords do not match.";
  }

  return null;
}
