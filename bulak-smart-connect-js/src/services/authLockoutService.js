import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';

export const authLockoutService = {
  async checkAccountLockout(identifier) {
    try {
      logger.log(`🔍 Checking account lockout for: ${identifier}`);
      const response = await axios.post(`${config.API_BASE_URL}/auth/check-lockout`, {
        identifier
      });
      logger.log('✅ Lockout check result:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking account lockout:', error);
      return { isLocked: false, attempts: 0 };
    }
  },

  async recordFailedAttempt(identifier) {
    try {
      logger.log(`📝 Recording failed attempt for: ${identifier}`);
      const response = await axios.post(`${config.API_BASE_URL}/auth/record-failed-attempt`, {
        identifier
      });
      logger.log('✅ Failed attempt recorded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error recording failed attempt:', error);
      return { attempts: 0, isLocked: false };
    }
  },

  async clearAccountLockout(identifier) {
    try {
      logger.log(`🧹 Clearing account lockout for: ${identifier}`);
      await axios.post(`${config.API_BASE_URL}/auth/clear-lockout`, {
        identifier
      });
      logger.log('✅ Account lockout cleared');
    } catch (error) {
      console.error('❌ Error clearing account lockout:', error);
    }
  }
};