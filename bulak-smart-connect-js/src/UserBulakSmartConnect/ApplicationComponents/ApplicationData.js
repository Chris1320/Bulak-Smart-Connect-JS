import logger from '../../utils/logger.js';

// src/services/ApplicationDataService.js

/**
 * Service for retrieving and managing application data
 */
export const getApplications = () => {
  try {
    const storedApplications = JSON.parse(localStorage.getItem('applications')) || [];
    return storedApplications;
  } catch (err) {
    logger.error('Error loading applications:', err.message);
    return [];
  }
};

export const updateApplication = (applicationId, updatedData) => {
  try {
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');
    const index = applications.findIndex(app => app.id === applicationId);

    if (index !== -1) {
      applications[index] = { ...applications[index], ...updatedData };
      localStorage.setItem('applications', JSON.stringify(applications));
      return true;
    }
    logger.log(`Found application at index ${index}`);
    logger.log('Original:', applications[index]);
    return false;
  } catch (error) {
    logger.error('Error updating application:', error);
    return false;
  }
};

export const addApplication = applicationData => {
  try {
    const applications = getApplications();
    applications.push(applicationData);
    localStorage.setItem('applications', JSON.stringify(applications));
    return true;
  } catch (err) {
    logger.error('Error adding application:', err.message);
    return false;
  }
};

export const getApplicationsByType = type => {
  try {
    const applications = getApplications();
    return applications.filter(app => app.type === type);
  } catch (error) {
    logger.error(`Error getting applications of type ${type}:`, error);
    return [];
  }
};
