import React, { useState, useEffect } from 'react';
import logger from '../../../utils/logger';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Tooltip,
  CircularProgress,
  Snackbar,
  Container,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import FileUpload from '../FileUpload';
import NavBar from '../../../NavigationComponents/NavSide';
import './DelayedOutOfTown.css';
import { documentApplicationService } from '../../../services/documentApplicationService';
import { localStorageManager } from '../../../services/localStorageManager';
import { documentApplicationNotificationService } from '../../../services/documentApplicationNotificationService'; // ADD THIS IMPORT

const baseRequiredDocuments = [
  'Negative Certification from PSA',
  'Self-Affidavit of Out of Town Registration attested by 2 witnesses with ID',
  'Barangay Certification',
  'National ID , ePhil ID or PhilSys transaction slip',
  'Unedited 2x2 front-facing photo, white background',
  'Any two (2) of the following documents of parents',
  'Any two (2) of the following documentary evidence',
];

const maritalDocuments = [
  ...baseRequiredDocuments,
  'Certificate of Marriage of Parents (Marital Child)',
];

const nonMaritalDocuments = baseRequiredDocuments;

const GovernmentIdTooltip = ({ children }) => {
  const acceptedIds = [
    'Philippine Passport',
    'PhilSys ID or National ID',
    "Driver's License",
    'PRC ID',
    'UMID (Unified Multi-Purpose ID)',
    'SSS ID',
    'GSIS eCard',
    'OWWA ID',
    'Senior Citizen ID',
    'PWD ID',
    "Voter's ID or Voter's Certification",
    'Postal ID',
    'Barangay ID or Barangay Clearance with photo',
    'TIN ID',
    'PhilHealth ID',
    'Pag-IBIG Loyalty Card Plus',
    'Indigenous Peoples (IP) ID or certification',
  ];

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Accepted Government IDs:
          </Typography>
          {acceptedIds.map((id, index) => (
            <Typography key={index} variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
              • {id}
            </Typography>
          ))}
        </Box>
      }
      arrow
      placement="top"
      sx={{
        '& .MuiTooltip-tooltip': {
          maxWidth: 300,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        },
      }}
    >
      <span
        style={{
          textDecoration: 'underline',
          cursor: 'pointer',
          color: '#1976d2',
          fontWeight: 'bold',
        }}
      >
        {children}
      </span>
    </Tooltip>
  );
};

const documentDescriptions = {
  // Required Documents
  'Negative Certification from PSA': '- Certificate showing no birth record exists in PSA database',
  'Self-Affidavit of Out of Town Registration attested by 2 witnesses with ID': (
    <>
      - Notarized affidavit stating that the birth occurred outside the place of registration,
      witnessed by two people with valid{' '}
      <GovernmentIdTooltip>government issued IDs</GovernmentIdTooltip>
    </>
  ),
  'Barangay Certification':
    '-  Issued by the Punong Barangay as proof of residency and with statement on facts of birth',
  'National ID , ePhil ID or PhilSys transaction slip':
    '- A valid National ID, ePhilID, or PhilSys transaction slip is required for this application. If you do not have any of these, please stay updated on the San Ildefonso National ID booth schedules, check other PhilSys registration centers, and secure your ID or transaction slip before proceeding.',
  'Unedited 2x2 front-facing photo, white background':
    '- Recent passport-style photo taken within the last 3 months with white background',
  'Transmittal through the PSO':
    '- Official transmittal document through the Provincial Statistics Office',

  // Parent Documents
  'Any two (2) of the following documents of parents': (
    <>
      - Any of the following: Certificate of Live Birth (COLB),{' '}
      <GovernmentIdTooltip> Government Issued ID</GovernmentIdTooltip>, Marriage Certificate, or
      Certificate of Death (if deceased){' '}
    </>
  ),
  // Documentary Evidence
  'Any two (2) of the following documentary evidence':
    "- Any of the following: Baptismal Certificate, Marriage Certificate, School Records, Income Tax Return, PhilHealth MDR, or Voter's Registration Record (COMELEC)",
};

const DelayedOutOfTownRegistration = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [fileData, setFileData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [formData, setFormData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [applicationId, setApplicationId] = useState(null);
  const [backendApplicationCreated, setBackendApplicationCreated] = useState(false);
  const [uploadedDocumentsCount, setUploadedDocumentsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('');

  const isEditing =
    location.state?.isEditing || localStorage.getItem('isEditingBirthApplication') === 'true';

  // Show snackbar notification
  const showNotification = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Create application in backend
  const createBackendApplication = async () => {
    try {
      logger.log('Creating application in backend...');

      // Get current application ID from localStorage or create a new one
      const currentId = localStorage.getItem('currentApplicationId');
      let appId = currentId;

      if (!appId) {
        appId = 'BC-' + Date.now().toString().slice(-6);
        logger.log('Generated new application ID:', appId);
        localStorage.setItem('currentApplicationId', appId);
      }

      setApplicationId(appId);

      // Prepare data for backend
      const backendApplicationData = {
        applicationType: 'Birth Certificate',
        applicationSubtype: 'Delayed Registration - Out of Town',
        applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`,
        applicantDetails: JSON.stringify({ ...formData }),
        formData: formData,
        status: 'PENDING',
      };

      logger.log('Creating application with data:', backendApplicationData);

      // Call API to create application
      const response = await documentApplicationService.createApplication(backendApplicationData);
      logger.log('Backend created application:', response);

      // Store the backend ID
      if (response && response.id) {
        localStorage.setItem('currentApplicationId', response.id);
        setApplicationId(response.id);
        setBackendApplicationCreated(true);
      }

      return response;
    } catch (error) {
      logger.error('Failed to create application in backend:', error);
      showNotification(
        `Failed to register application: ${error.message}. Please try again.`,
        'error'
      );
      return null;
    }
  };

  // Update uploaded documents count when uploadedFiles changes
  useEffect(() => {
    const count = Object.values(uploadedFiles).filter(Boolean).length;
    setUploadedDocumentsCount(count);
    logger.log(`Uploaded documents count: ${count}`);
  }, [uploadedFiles]);

  useEffect(() => {
    const maritalStatus = localStorage.getItem('maritalStatus');
    if (maritalStatus) {
      setStatus(maritalStatus);
      logger.log('Status loaded from localStorage:', maritalStatus);
    }

    const loadData = async () => {
      try {
        setIsInitializing(true);

        // Load application data
        if (isEditing) {
          logger.log('Loading data for editing...');
          const editingId = localStorage.getItem('editingApplicationId');
          logger.log('Editing application ID:', editingId);

          if (editingId) {
            setApplicationId(editingId);

            // Check if this application exists in backend
            try {
              const backendApp = await documentApplicationService.getApplication(editingId);
              if (backendApp) {
                setBackendApplicationCreated(true);
                logger.log('Application exists in backend:', backendApp);
              }
            } catch (error) {
              logger.warn('Application may not exist in backend:', error);
            }
          }

          // Get applications from localStorage
          const applications = JSON.parse(localStorage.getItem('applications') || '[]');
          const applicationToEdit = applications.find(app => app.id === editingId);

          if (applicationToEdit) {
            logger.log('Found application to edit:', applicationToEdit);
            if (applicationToEdit.uploadedFiles) {
              setUploadedFiles(applicationToEdit.uploadedFiles || {});
            }
            if (applicationToEdit.formData) {
              setFormData(applicationToEdit.formData);
            }
          } else {
            // Fallback to direct form data if available
            const savedFormData = localStorage.getItem('birthCertificateApplication');
            if (savedFormData) {
              const parsedData = JSON.parse(savedFormData);
              setFormData(parsedData);
              if (parsedData.uploadedFiles) {
                setUploadedFiles(parsedData.uploadedFiles || {});
              }
              logger.log('Loaded form data from birthCertificateApplication');
            }
          }
        } else {
          // If not editing, check for current application data
          const currentId = localStorage.getItem('currentApplicationId');
          if (currentId) {
            setApplicationId(currentId);

            // Check if this application exists in backend
            try {
              const backendApp = await documentApplicationService.getApplication(currentId);
              if (backendApp) {
                setBackendApplicationCreated(true);
                logger.log('Application exists in backend:', backendApp);
              }
            } catch (error) {
              logger.warn('Application may not exist in backend:', error);

              // If we have form data but no backend application, automatically create it
              const currentApplicationData = localStorage.getItem('birthCertificateApplication');
              if (currentApplicationData) {
                const parsedData = JSON.parse(currentApplicationData);
                setFormData(parsedData);

                // Auto-create backend application if needed
                await createBackendApplication();
              }
            }
          }

          const currentApplicationData = localStorage.getItem('birthCertificateApplication');
          if (currentApplicationData) {
            const parsedData = JSON.parse(currentApplicationData);
            setFormData(parsedData);
            if (parsedData.uploadedFiles) {
              setUploadedFiles(parsedData.uploadedFiles || {});
            }
          }
        }

        // Check storage usage
        const usage = localStorageManager.getCurrentUsage();
        logger.log(`📊 Current storage usage: ${usage.percentage.toFixed(1)}%`);

        if (usage.isNearFull) {
          logger.warn('⚠️ localStorage is getting full, performing cleanup...');
          await localStorageManager.performCleanup(0.2);
        }
      } catch (error) {
        logger.error('Error during initialization:', error);
        showNotification('Error loading application data', 'error');
      } finally {
        setIsInitializing(false);
      }
    };

    loadData();
  }, [isEditing]);

  // Function to convert data URL to File object
  function dataURLtoFile(dataurl, filename, type) {
    try {
      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : type;
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      logger.error('Error converting data URL to file:', error);
      throw new Error('Invalid file format');
    }
  }

  const handleFileUpload = async (label, isUploaded, fileDataObj) => {
    // Create application if needed before uploading files
    if (!backendApplicationCreated && isUploaded) {
      setIsLoading(true);
      const createdApp = await createBackendApplication();
      setIsLoading(false);

      if (!createdApp) {
        showNotification('Failed to register application. Cannot upload files.', 'error');
        return;
      }
    }

    // Update the uploadedFiles state
    setUploadedFiles(prevState => {
      const newState = { ...prevState, [label]: isUploaded };
      logger.log('Updated uploadedFiles:', newState);
      return newState;
    });

    if (isUploaded && fileDataObj) {
      setFileData(prevState => ({
        ...prevState,
        [label]: fileDataObj,
      }));

      // === Upload to backend ===
      try {
        const currentAppId = applicationId || localStorage.getItem('currentApplicationId');
        if (!currentAppId) {
          showNotification('Application ID is missing. Cannot upload file.', 'error');
          return;
        }

        logger.log('Application ID:', currentAppId);

        // Handle multiple files (array) or single file (object)
        const filesToUpload = Array.isArray(fileDataObj) ? fileDataObj : [fileDataObj];

        for (const [index, fileData] of filesToUpload.entries()) {
          logger.log(`Uploading file ${index + 1}:`, fileData.name);

          const file = dataURLtoFile(fileData.data, fileData.name, fileData.type);

          // For multiple files, append index to label
          const uploadLabel = filesToUpload.length > 1 ? `${label} - File ${index + 1}` : label;

          const response = await documentApplicationService.uploadFile(
            currentAppId,
            file,
            uploadLabel
          );
          logger.log(`Upload response for ${fileData.name}:`, response);
        }

        const fileCount = filesToUpload.length;
        const successMessage =
          fileCount > 1
            ? `${fileCount} files uploaded successfully for "${label}"!`
            : `"${label}" uploaded successfully!`;

        showNotification(successMessage, 'success');
      } catch (error) {
        logger.error(`Failed to upload "${label}":`, error);

        // Show detailed error information
        if (error.response) {
          logger.error('Server response:', error.response.status, error.response.data);

          // If error is 404 (application not found), try to create it and retry upload
          if (error.response.status === 404) {
            showNotification('Application not found. Creating new application...', 'info');
            const createdApp = await createBackendApplication();
            if (createdApp) {
              // Retry upload for all files
              try {
                const filesToUpload = Array.isArray(fileDataObj) ? fileDataObj : [fileDataObj];

                for (const [index, fileData] of filesToUpload.entries()) {
                  const file = dataURLtoFile(fileData.data, fileData.name, fileData.type);
                  const uploadLabel =
                    filesToUpload.length > 1 ? `${label} - File ${index + 1}` : label;

                  const retryResponse = await documentApplicationService.uploadFile(
                    createdApp.id,
                    file,
                    uploadLabel
                  );
                  logger.log(`Retry upload response for ${fileData.name}:`, retryResponse);
                }

                const fileCount = filesToUpload.length;
                const successMessage =
                  fileCount > 1
                    ? `${fileCount} files uploaded successfully for "${label}"!`
                    : `"${label}" uploaded successfully!`;

                showNotification(successMessage, 'success');
                return;
              } catch (retryError) {
                logger.error('Retry upload failed:', retryError);
              }
            }
          }

          showNotification(
            `Failed to upload "${label}": ${error.response.data?.message || error.message}`,
            'error'
          );
        } else {
          showNotification(`Failed to upload "${label}": ${error.message}`, 'error');
        }

        // Revert the upload state on error
        setUploadedFiles(prevState => ({
          ...prevState,
          [label]: false,
        }));
      }
    } else {
      setFileData(prevState => {
        const newState = { ...prevState };
        delete newState[label];
        return newState;
      });
    }
  };

  const isMandatoryComplete = () => {
    const incomplete = baseRequiredDocuments.filter(doc => uploadedFiles[doc] !== true);
    if (incomplete.length > 0) {
      logger.log('Missing uploads for:', incomplete);
    }
    return incomplete.length === 0;
  };
  const mapStatusForBackend = frontendStatus => {
    const statusMap = {
      Submitted: 'Pending',
      SUBMITTED: 'Pending',
      Pending: 'Pending',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Declined: 'Rejected',
      'Ready for Pickup': 'Ready for Pickup',
    };

    return statusMap[frontendStatus] || 'Pending';
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setIsSubmitted(true);

      // Get the application ID
      const currentAppId = applicationId || localStorage.getItem('currentApplicationId');
      if (!currentAppId) {
        logger.error('No application ID found');
        showNotification('Application ID is missing. Cannot proceed.', 'error');
        setIsLoading(false);
        setIsSubmitted(false);
        return;
      }

      // Check storage usage before saving
      const usage = localStorageManager.getCurrentUsage();
      if (usage.isCritical) {
        logger.warn('Storage critical, performing cleanup before save...');
        await localStorageManager.performCleanup(0.4);
      }

      // Backend data preparation
      const backendData = {
        status: mapStatusForBackend('SUBMITTED'),
        statusMessage: 'Application submitted with all required documents',
        applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`,
        applicationType: 'Birth Certificate',
        applicationSubtype: 'Delayed Registration - Out of Town',
      };

      // Update the backend application
      try {
        const response = await documentApplicationService.updateApplication(
          currentAppId,
          backendData
        );
        logger.log('Application status updated in backend:', response);
      } catch (error) {
        logger.error('Failed to update backend status:', error);
        showNotification(
          'Warning: Failed to update backend status. Continuing with local update.',
          'warning'
        );
        // Continue with local update even if backend fails
      }

      // Update localStorage with auto-cleanup support
      const updatedFormData = {
        ...formData,
        uploadedFiles: fileData,
        status: 'Pending',
        submittedAt: new Date().toISOString(),
      };

      // Get current applications
      const applications = JSON.parse(localStorage.getItem('applications') || '[]');
      const appIndex = applications.findIndex(app => app.id === currentAppId);

      if (appIndex >= 0) {
        // Update existing application
        applications[appIndex] = {
          ...applications[appIndex],
          formData: {
            ...applications[appIndex].formData,
            ...updatedFormData,
          },
          uploadedFiles: fileData,
          status: 'Pending',
          lastUpdated: new Date().toISOString(),
        };
      } else {
        // If not found, add as new application
        applications.push({
          id: currentAppId,
          type: 'Birth Certificate',
          applicationType: 'Delayed Registration',
          applicationSubtype: 'Delayed Registration - Out of Town',
          date: new Date().toLocaleDateString(),
          status: 'Pending',
          message: `Birth Certificate application for ${formData.firstName || ''} ${formData.lastName || ''}`,
          formData: updatedFormData,
          uploadedFiles: fileData,
          lastUpdated: new Date().toISOString(),
        });
      }

      // Use safe storage methods
      const applicationsStored = await localStorageManager.safeSetItem(
        'applications',
        JSON.stringify(applications)
      );

      const formDataStored = await localStorageManager.safeSetItem(
        'birthCertificateApplication',
        JSON.stringify(updatedFormData)
      );

      // 📧 SEND CONFIRMATION NOTIFICATION (ENHANCED)
      const userEmail = user?.email;
      if (userEmail) {
        try {
          logger.log('📧 Sending application confirmation notification to:', userEmail);
          const notificationResult =
            await documentApplicationNotificationService.sendApplicationConfirmation(
              userEmail,
              currentAppId,
              {
                type: 'Birth Certificate',
                subtype: 'Delayed Registration - Out of Town',
                applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                submissionDate: new Date().toLocaleDateString(),
                status: 'Pending',
              }
            );

          if (notificationResult.success) {
            logger.log('✅ Confirmation notification sent successfully');
          } else {
            logger.log('⚠️ Confirmation notification failed:', notificationResult.error);
          }
        } catch (notificationError) {
          logger.error('❌ Error sending confirmation notification:', notificationError);
        }
      } else {
        logger.log('⚠️ No email available for notifications');
      }

      if (!applicationsStored || !formDataStored) {
        showNotification(
          'Application submitted successfully! Note: Some data may not be saved locally due to storage limitations.',
          'warning'
        );
      } else {
        showNotification('Application submitted successfully!', 'success');
      }

      // Dispatch storage events
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(
        new CustomEvent('customStorageUpdate', {
          detail: {
            id: currentAppId,
            action: 'updated',
            type: 'Birth Certificate',
            subtype: 'Delayed Registration - Out of Town',
          },
        })
      );

      logger.log('Application submitted successfully');

      // Navigate to summary page after a short delay
      setTimeout(() => {
        navigate('/BirthApplicationSummary');
      }, 2000);
    } catch (error) {
      logger.error('Error submitting application:', error);
      showNotification(`Error submitting application: ${error.message}`, 'error');
      setIsLoading(false);
      setIsSubmitted(false);
    }
  };

  return (
    <div className={`DelayedOutOfTownContainer ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Typography variant="h5" className="TitleDelayedOutOfTown">
        Delayed Registration of Birth (Out of Town)
      </Typography>

      {isInitializing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} className="DocumentsPaperOutOfTown">
          <Typography variant="body1" className="SectionTitleDelayedOutOfTown">
            Mandatory Requirements:
          </Typography>

          <Typography variant="body1" className="PersonalAppearanceOut">
            Personal Appearance of the Document Owner
          </Typography>

          {isLoading && !backendApplicationCreated && (
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Creating application record... Please wait.
              </Typography>
            </Box>
          )}
          <Container className="DelayedOutOfTownUpload">
            <Box>
              {(status === 'marital' ? maritalDocuments : nonMaritalDocuments).map((doc, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <FileUpload
                    label={doc}
                    description={documentDescriptions[doc]}
                    onUpload={(isUploaded, fileDataObj) =>
                      handleFileUpload(doc, isUploaded, fileDataObj)
                    }
                    disabled={isLoading}
                    multiple={true}
                  />
                </div>
              ))}
            </Box>
          </Container>

          <Box className="ImportantNotes">
            <Typography variant="h6">IMPORTANT NOTES:</Typography>
            <Typography variant="body2">PROCESSING DURATION: 10 days </Typography>
            <Typography variant="body2">INQUIRY: 0936-541-0787 / slbncr@yahoo.com</Typography>
          </Box>

          {isSubmitted && (
            <Alert severity="success" sx={{ marginTop: '20px' }}>
              Your application has been submitted successfully! Redirecting...
            </Alert>
          )}

          <Box className="ButtonContainerOutOfTown">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                const modifyApplicationState = {
                  applicationId: applicationId,
                  isEditing: true,
                  editingApplicationId: applicationId,

                  formData: {
                    ...formData,
                    documentStatus: status,
                    uploadedFiles: uploadedFiles,
                    fileData: fileData,
                    lastModified: new Date().toISOString(),
                  },

                  uploadedFiles: uploadedFiles,
                  fileData: fileData,

                  documentStatus: status,
                  maritalStatus: status,

                  modifyMode: true,
                  preserveData: true,
                  backFromDelayedRegistration: true,
                  applicationType: 'Delayed Registration - Out of Town',
                };

                try {
                  localStorage.setItem(
                    'birthCertificateApplication',
                    JSON.stringify(modifyApplicationState.formData)
                  );

                  localStorage.setItem('isEditingBirthApplication', 'true');
                  localStorage.setItem('editingApplicationId', applicationId);
                  localStorage.setItem('currentApplicationId', applicationId);

                  localStorage.setItem('maritalStatus', status);

                  localStorage.setItem(
                    'modifyingApplication',
                    JSON.stringify({
                      id: applicationId,
                      type: 'Birth Certificate - Delayed Registration',
                      subtype: 'Delayed Registration - Out of Town',
                      documentStatus: status,
                      uploadedFiles: uploadedFiles,
                      timestamp: new Date().toISOString(),
                    })
                  );

                  const applications = JSON.parse(localStorage.getItem('applications') || '[]');
                  const appIndex = applications.findIndex(app => app.id === applicationId);

                  if (appIndex >= 0) {
                    applications[appIndex] = {
                      ...applications[appIndex],
                      formData: modifyApplicationState.formData,
                      uploadedFiles: uploadedFiles,
                      documentStatus: status,
                      status: applications[appIndex].status || 'In Progress',
                      lastModified: new Date().toISOString(),
                      isBeingModified: true,
                    };

                    localStorage.setItem('applications', JSON.stringify(applications));
                  }

                  logger.log('Navigating back with modify state:', modifyApplicationState);

                  navigate('/BirthCertificateForm', {
                    state: modifyApplicationState,
                    replace: false,
                  });
                } catch (error) {
                  logger.error('Error saving modify state:', error);
                  showNotification('Error saving current state. Some data may be lost.', 'warning');

                  navigate('/BirthCertificateForm', {
                    state: {
                      applicationId: applicationId,
                      isEditing: true,
                      editingApplicationId: applicationId,
                      formData: formData,
                      documentStatus: status,
                    },
                  });
                }
              }}
              className="BackButtonDelayedAbove18"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!isMandatoryComplete() || isLoading || isSubmitted}
              onClick={handleSubmit}
              className="SubmitButtonOutOfTown"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DelayedOutOfTownRegistration;
