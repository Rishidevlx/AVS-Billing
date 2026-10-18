import * as authService from '../services/auth.service.js';
import * as userRepository from '../repositories/user.repository.js';

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.loginUser({ identifier, password });

    // Store long-lived Refresh Token in secure httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${result.user.fullName || result.user.username}!`,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 1;
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword({
      userId,
      currentPassword,
      newPassword,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 1;
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
