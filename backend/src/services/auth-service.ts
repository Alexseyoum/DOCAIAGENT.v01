import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthUser {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(payload: TokenPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: config.jwtExpiresIn
      };

      const token = jwt.sign(payload, config.jwtSecret, options);

      logger.info({ userId: payload.userId }, 'Token generated');
      return token;
    } catch (error) {
      logger.error({ error }, 'Token generation failed');
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.warn({ error }, 'Token verification failed');
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate API key (simplified - for demo purposes)
   */
  generateApiKey(userId: string): string {
    const payload = {
      userId,
      type: 'api_key',
      timestamp: Date.now()
    };

    return jwt.sign(payload, config.jwtSecret);
  }

  /**
   * Verify API key
   */
  verifyApiKey(apiKey: string): { userId: string; valid: boolean } {
    try {
      const decoded: any = jwt.verify(apiKey, config.jwtSecret);
      return {
        userId: decoded.userId,
        valid: decoded.type === 'api_key'
      };
    } catch {
      return {
        userId: '',
        valid: false
      };
    }
  }
}

export const authService = new AuthService();
