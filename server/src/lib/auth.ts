import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePasswords = async (
  plainPassword: string, 
  hashedPassword: string | null
): Promise<boolean> => {
  if (hashedPassword === null) {
    console.log('Comparison failed: No hashed password');
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Bcrypt comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};
