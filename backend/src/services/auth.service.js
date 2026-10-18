import * as userRepository from '../repositories/user.repository.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export const loginUser = async ({ identifier, password }) => {
  const user = await userRepository.findByEmailOrUsername(identifier);

  if (!user) {
    const error = new Error('Invalid email/username or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if account is active
  if (!user.is_active) {
    const error = new Error('This account has been deactivated. Please contact administrator.');
    error.statusCode = 403;
    throw error;
  }

  // Check if account is currently locked due to too many failed attempts
  if (user.lock_until && new Date(user.lock_until) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(user.lock_until) - new Date()) / (60 * 1000)
    );
    const error = new Error(
      `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute(s).`
    );
    error.statusCode = 423; // Locked
    throw error;
  }

  // Verify bcrypt password
  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    await userRepository.incrementFailedAttempts(user.id, 5, 15);
    const error = new Error('Invalid email/username or password');
    error.statusCode = 401;
    throw error;
  }

  // Reset failed attempts & update last login
  await userRepository.updateLoginSuccess(user.id);

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    uuid: user.uuid,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepository.findUserWithPasswordById(userId);

  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await comparePassword(currentPassword, user.password_hash);
  if (!isMatch) {
    const error = new Error('Current password does not match our records');
    error.statusCode = 400;
    throw error;
  }

  // Hash new password and save to TiDB
  const newPasswordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, newPasswordHash);

  return {
    success: true,
    message: 'Password changed successfully',
  };
};
