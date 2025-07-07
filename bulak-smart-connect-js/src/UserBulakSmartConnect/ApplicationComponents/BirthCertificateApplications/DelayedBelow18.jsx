import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Alert,
  Paper,
  Snackbar,
  CircularProgress,
  Container,
  Tooltip,
} from '@mui/material';
import FileUpload from '../FileUpload';
import './DelayedBelow18.css';
import NavBar from '../../../NavigationComponents/NavSide';
import { documentApplicationService } from '../../../services/documentApplicationService';
import { documentApplicationNotificationService } from '../../../services/documentApplicationNotificationService';
import { localStorageManager } from '../../../services/localStorageManager';
import { useAuth } from '../../../context/AuthContext';

const mandatoryDocuments = [
  'Negative Certification from PSA',
  'Two (2) Documentary Evidences',
  'Affidavit of Disinterested Person 1 (Not Related) with ID',
  'Affidavit of Disinterested Persons 2 (Not Related) with ID',
  'Unedited Front-Facing Photo (2x2, White Background)',
  'Documentary Evidence/s of Parents',
  'Barangay Certification of Residency',
  'National ID , ePhil ID or PhilSys transaction slip',
];
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
  'Negative Certification from PSA': '- Certificate showing no birth record exists in PSA database',
  'Two (2) Documentary Evidences':
    '- Hospital records, baptismal certificate, school records, MDR, Philhealth records, etc.',
  'Affidavit of Disinterested Person 1 (Not Related) with ID': (
    <>
      - Sworn statement from non-relative witness and witness{' '}
      <GovernmentIdTooltip>government issued ID</GovernmentIdTooltip>
    </>
  ),
  'Affidavit of Disinterested Persons 2 (Not Related) with ID': (
    <>
      - Sworn statement from second non-relative witness and witness{' '}
      <GovernmentIdTooltip>government issued ID</GovernmentIdTooltip>
    </>
  ),
  'Unedited Front-Facing Photo (2x2, White Background)':
    '- Recent passport-style photo taken within the last 3 months with white background',
  'Documentary Evidence/s of Parents': '- Birth certificate of parents, marriage certificate, etc.',
  'Barangay Certification of Residency': '- Certificate of residency from local barangay',
  'National ID , ePhil ID or PhilSys transaction slip':
    '- A valid National ID, ePhilID, or PhilSys transaction slip is required for this application. If you do not have any of these, please stay updated on the San Ildefonso National ID booth schedules, check other PhilSys registration centers, and secure your ID or transaction slip before proceeding.',
  'Certificate of Marriage of Parents': "- Official marriage certificate of applicant's parents",
  'Affidavit of Whereabouts of the Mother': "- Sworn statement explaining mother's absence",
};

const Below18Registration = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [motherNotPresent, setMotherNotPresent] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState('');
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
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isEditing =
    location.state?.isEditing || localStorage.getItem('isEditingBirthApplication') === 'true';
  const maritalSatus = localStorage.getItem('maritalStatus');

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
      console.log('Creating application in backend...');

      // Get current application ID from localStorage or create a new one
      const currentId = localStorage.getItem('currentApplicationId');
      let appId = currentId;

      if (!appId) {
        appId = 'BC-' + Date.now().toString().slice(-6);
        console.log('Generated new application ID:', appId);
        localStorage.setItem('currentApplicationId', appId);
      }

      setApplicationId(appId);

      // Prepare data for backend
      const backendApplicationData = {
        applicationType: 'Birth Certificate',
        applicationSubtype: 'Delayed Registration - Below 18',
        applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`,
        applicantDetails: JSON.stringify({ ...formData, documentStatus: maritalStatus }),
        formData: formData,
        status: 'PENDING',
      };

      console.log('Creating application with data:', backendApplicationData);

      // Call API to create application
      const response = await documentApplicationService.createApplication(backendApplicationData);
      console.log('Backend created application:', response);

      // Store the backend ID
      if (response && response.id) {
        localStorage.setItem('currentApplicationId', response.id);
        setApplicationId(response.id);
        setBackendApplicationCreated(true);
      }

      return response;
    } catch (error) {
      console.error('Failed to create application in backend:', error);
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
    console.log(`Uploaded documents count: ${count}`);
  }, [uploadedFiles]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsInitializing(true);

        // Load application data
        if (isEditing) {
          console.log('Loading data for editing...');
          const editingId = localStorage.getItem('editingApplicationId');
          console.log('Editing application ID:', editingId);

          if (editingId) {
            setApplicationId(editingId);

            // Check if this application exists in backend
            try {
              const backendApp = await documentApplicationService.getApplication(editingId);
              if (backendApp) {
                setBackendApplicationCreated(true);
                console.log('Application exists in backend:', backendApp);
              }
            } catch (error) {
              console.warn('Application may not exist in backend:', error);
            }
          }

          // Get applications from localStorage
          const applications = JSON.parse(localStorage.getItem('applications') || '[]');
          const applicationToEdit = applications.find(app => app.id === editingId);

          if (applicationToEdit) {
            console.log('Found application to edit:', applicationToEdit);
            if (applicationToEdit.documentStatus) {
              setMaritalStatus(applicationToEdit.documentStatus);
            }
            if (applicationToEdit.uploadedFiles) {
              setUploadedFiles(applicationToEdit.uploadedFiles || {});
            }
            if (applicationToEdit.formData) {
              setFormData(applicationToEdit.formData);
              if (applicationToEdit.formData.motherNotPresent) {
                setMotherNotPresent(applicationToEdit.formData.motherNotPresent);
              }
            }
          } else {
            // Fallback to direct form data if available
            const savedFormData = localStorage.getItem('birthCertificateApplication');
            if (savedFormData) {
              const parsedData = JSON.parse(savedFormData);
              setFormData(parsedData);
              if (parsedData.documentStatus) {
                setMaritalStatus(parsedData.documentStatus);
              }
              if (parsedData.uploadedFiles) {
                setUploadedFiles(parsedData.uploadedFiles || {});
              }
              if (parsedData.motherNotPresent) {
                setMotherNotPresent(parsedData.motherNotPresent);
              }
              console.log('Loaded form data from birthCertificateApplication');
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
                console.log('Application exists in backend:', backendApp);
              }
            } catch (error) {
              console.warn('Application may not exist in backend:', error);

              // If we have form data but no backend application, automatically create it
              const currentApplicationData = localStorage.getItem('birthCertificateApplication');
              if (currentApplicationData) {
                const parsedData = JSON.parse(currentApplicationData);
                setFormData(parsedData);

                // Auto-create backend application if we have status
                if (parsedData.documentStatus) {
                  setMaritalStatus(parsedData.documentStatus);
                  await createBackendApplication();
                }
              }
            }
          }

          const currentApplicationData = localStorage.getItem('birthCertificateApplication');
          if (currentApplicationData) {
            const parsedData = JSON.parse(currentApplicationData);
            setFormData(parsedData);
            if (parsedData.documentStatus && !maritalStatus) {
              setMaritalStatus(parsedData.documentStatus);
            }
            if (parsedData.uploadedFiles) {
              setUploadedFiles(parsedData.uploadedFiles || {});
            }
            if (parsedData.motherNotPresent) {
              setMotherNotPresent(parsedData.motherNotPresent);
            }
          }
        }

        // Check storage usage
        const usage = localStorageManager.getCurrentUsage();
        console.log(`📊 Current storage usage: ${usage.percentage.toFixed(1)}%`);

        if (usage.isNearFull) {
          console.warn('⚠️ localStorage is getting full, performing cleanup...');
          await localStorageManager.performCleanup(0.2);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('Error loading application data', 'error');
      } finally {
        setIsInitializing(false);
      }
    };

    loadData();
  }, [isEditing, maritalStatus]);

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
      console.error('Error converting data URL to file:', error);
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
      console.log('Updated uploadedFiles:', newState);
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

        console.log('Application ID:', currentAppId);

        // Handle multiple files (array) or single file (object)
        const filesToUpload = Array.isArray(fileDataObj) ? fileDataObj : [fileDataObj];

        for (const [index, fileData] of filesToUpload.entries()) {
          console.log(`Uploading file ${index + 1}:`, fileData.name);

          const file = dataURLtoFile(fileData.data, fileData.name, fileData.type);

          // For multiple files, append index to label
          const uploadLabel = filesToUpload.length > 1 ? `${label} - File ${index + 1}` : label;

          const response = await documentApplicationService.uploadFile(
            currentAppId,
            file,
            uploadLabel
          );
          console.log(`Upload response for ${fileData.name}:`, response);
        }

        const fileCount = filesToUpload.length;
        const successMessage =
          fileCount > 1
            ? `${fileCount} files uploaded successfully for "${label}"!`
            : `"${label}" uploaded successfully!`;

        showNotification(successMessage, 'success');
      } catch (error) {
        console.error(`Failed to upload "${label}":`, error);

        // Show detailed error information
        if (error.response) {
          console.error('Server response:', error.response.status, error.response.data);

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
                  console.log(`Retry upload response for ${fileData.name}:`, retryResponse);
                }

                const fileCount = filesToUpload.length;
                const successMessage =
                  fileCount > 1
                    ? `${fileCount} files uploaded successfully for "${label}"!`
                    : `"${label}" uploaded successfully!`;

                showNotification(successMessage, 'success');
                return;
              } catch (retryError) {
                console.error('Retry upload failed:', retryError);
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
    const allMandatoryDocsUploaded = mandatoryDocuments.every(doc => {
      const isUploaded = uploadedFiles[doc] === true;
      if (!isUploaded) {
        console.log(`Missing document: ${doc}`);
      }
      return isUploaded;
    });

    const isCertificateOfMarriageUploaded =
      maritalStatus !== 'marital' || uploadedFiles['Certificate of Marriage of Parents'] === true;

    if (!isCertificateOfMarriageUploaded) {
      console.log('Missing Certificate of Marriage of Parents');
    }

    const isMotherAffidavitUploaded =
      !motherNotPresent || uploadedFiles['Affidavit of Whereabouts of the Mother'] === true;

    if (!isMotherAffidavitUploaded) {
      console.log('Missing Affidavit of Whereabouts of the Mother');
    }

    return allMandatoryDocsUploaded && isCertificateOfMarriageUploaded && isMotherAffidavitUploaded;
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
        console.error('No application ID found');
        showNotification('Application ID is missing. Cannot proceed.', 'error');
        setIsLoading(false);
        setIsSubmitted(false);
        return;
      }

      // Check storage usage before saving
      const usage = localStorageManager.getCurrentUsage();
      if (usage.isCritical) {
        console.warn('Storage critical, performing cleanup before save...');
        await localStorageManager.performCleanup(0.4);
      }

      // Backend data preparation
      const backendData = {
        status: mapStatusForBackend('SUBMITTED'),
        statusMessage: 'Application submitted with all required documents',
        documentStatus: maritalStatus, // marital or non-marital status
        applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`,
        applicationType: 'Birth Certificate',
        applicationSubtype: 'Delayed Registration - Below 18',
        motherNotPresent: motherNotPresent,
      };

      // Update the backend application
      try {
        const response = await documentApplicationService.updateApplication(
          currentAppId,
          backendData
        );
        console.log('Application status updated in backend:', response);
      } catch (error) {
        console.error('Failed to update backend status:', error);
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
        documentStatus: maritalStatus,
        motherNotPresent: motherNotPresent,
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
          documentStatus: maritalStatus,
          motherNotPresent: motherNotPresent,
          status: 'Pending',
          lastUpdated: new Date().toISOString(),
        };
      } else {
        // If not found, add as new application
        applications.push({
          id: currentAppId,
          type: 'Birth Certificate',
          applicationType: 'Delayed Registration',
          applicationSubtype: 'Delayed Registration - Below 18',
          date: new Date().toLocaleDateString(),
          status: 'Pending',
          message: `Birth Certificate application for ${formData.firstName || ''} ${formData.lastName || ''}`,
          formData: updatedFormData,
          uploadedFiles: fileData,
          documentStatus: maritalStatus,
          motherNotPresent: motherNotPresent,
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
            subtype: 'Delayed Registration - Below 18',
          },
        })
      );

      console.log('Application submitted successfully');

      // 📧 SEND CONFIRMATION NOTIFICATION (ENHANCED)
      const userEmail = user?.email;
      if (userEmail) {
        try {
          console.log('📧 Sending application confirmation notification to:', userEmail);
          const notificationResult =
            await documentApplicationNotificationService.sendApplicationConfirmation(
              userEmail,
              currentAppId,
              {
                type: 'Birth Certificate',
                subtype: 'Delayed Registration - Below 18',
                applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                submissionDate: new Date().toLocaleDateString(),
                status: 'Pending',
              }
            );

          if (notificationResult.success) {
            console.log('✅ Confirmation notification sent successfully');
            showNotification(
              'Application submitted successfully! A confirmation email has been sent to you.',
              'success'
            );
          } else {
            console.log('⚠️ Confirmation notification failed:', notificationResult.error);
            showNotification(
              'Application submitted successfully! However, we could not send the confirmation email.',
              'warning'
            );
          }
        } catch (notificationError) {
          console.error('❌ Error sending confirmation notification:', notificationError);
          showNotification(
            'Application submitted successfully! However, we could not send the confirmation email.',
            'warning'
          );
        }
      } else {
        console.log('⚠️ No email available for notifications');
      }
      setTimeout(() => {
        navigate('/BirthApplicationSummary');
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      showNotification(`Error submitting application: ${error.message}`, 'error');
      setIsLoading(false);
      setIsSubmitted(false);
    }
  };


  return (
    <div className={`FormContainerBelow18 ${isSidebarOpen ? 'SidebarOpenBelow18' : ''}`}>
      <Typography variant="h5" className="FormTitleBelow18">
        Application for Delayed Registration - Below 18
      </Typography>

      {isInitializing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} className="DocumentsPaperBelow18">
          <>
            <Box>
              <Typography variant="body1" className="SectionTitleBelow18">
                Mandatory Documents:
              </Typography>
              {isLoading && !backendApplicationCreated && (
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Creating application record... Please wait.
                  </Typography>
                </Box>
              )}
              {mandatoryDocuments.map((doc, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <FileUpload
                    label={doc}
                    description={documentDescriptions[doc]}
                    onUpload={(isUploaded, fileDataObj) =>
                      handleFileUpload(doc, isUploaded, fileDataObj)
                    }
                    required={true}
                    disabled={isLoading}
                    multiple={true}
                  />
                </div>
              ))}
            </Box>

            <Box>
              {maritalSatus === 'marital' && (
                <FileUpload
                  label="Certificate of Marriage of Parents"
                  onUpload={(isUploaded, fileDataObj) =>
                    handleFileUpload('Certificate of Marriage of Parents', isUploaded, fileDataObj)
                  }
                  required={true}
                  disabled={isLoading}
                />
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={motherNotPresent}
                    onChange={e => setMotherNotPresent(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Mother Will Not Be Personally Present"
                className="CheckboxBelow18"
              />

              {motherNotPresent && (
                <FileUpload
                  label="Affidavit of Whereabouts of the Mother"
                  description={documentDescriptions['Affidavit of Whereabouts of the Mother']}
                  onUpload={(isUploaded, fileDataObj) =>
                    handleFileUpload(
                      'Affidavit of Whereabouts of the Mother',
                      isUploaded,
                      fileDataObj
                    )
                  }
                  required={true}
                  disabled={isLoading}
                />
              )}
            </Box>

            <Box className="ImportantNotes">
              <Typography variant="h6">IMPORTANT NOTES:</Typography>
              <Typography variant="body2">PROCESSING DURATION: 10 Days </Typography>
              <Typography variant="body2">INQUIRY: 0936-541-0787 / slbncr@yahoo.com</Typography>
            </Box>

            {isSubmitted && (
              <Alert severity="success" sx={{ marginTop: '20px' }}>
                Your application has been submitted successfully! Redirecting...
              </Alert>
            )}

            <Box className="ButtonContainerBelow18">
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
                    applicationType: 'Delayed Registration - Below 18',
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
                        subtype: 'Below 18',
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

                    console.log('Navigating back with modify state:', modifyApplicationState);

                    navigate('/BirthCertificateForm', {
                      state: modifyApplicationState,
                      replace: false,
                    });
                  } catch (error) {
                    console.error('Error saving modify state:', error);
                    showNotification(
                      'Error saving current state. Some data may be lost.',
                      'warning'
                    );

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
                className="SubmitButtonBelow18"
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </Box>
          </>
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

export default Below18Registration;
