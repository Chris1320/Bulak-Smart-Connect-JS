import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography, Box, Paper, Alert, Snackbar } from '@mui/material';
import BirthCertificateApplicationData from './BirthCertificateApplicationData';
import './BirthCertificateForm.css';
import ChildIdentifyingForm from './BirthCertificateForm/ChildIdentifyingForm';
import MotherInformationBirthForm from './BirthCertificateForm/MotherIdentifyingForm';
import FatherInformationBirthForm from './BirthCertificateForm/FatherIdentifyingForm';
import MarriageInformationBirthForm from './BirthCertificateForm/MarriageIdentifyingForm';
import AffidavitBirthForm from './BirthCertificateForm/BirthBackIdentifyingForm';
import { documentApplicationService } from '../../../services/documentApplicationService';
import { localStorageManager } from '../../../services/localStorageManager';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import { useAuth } from '../../../context/AuthContext';
import userService from '../../../services/userService';
const backendTypeMap = {
  'Regular application': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Regular Application (0-1 month)',
  },
  'Above 18': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Delayed Registration - Above 18',
  },
  'Below 18': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Delayed Registration - Below 18',
  },
  'Foreign Parent': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Delayed Registration - Foreign Parent',
  },
  'Out of town': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Delayed Registration - Out of Town',
  },
  'Clerical Error': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Correction - Clerical Errors',
  },
  'Sex DOB': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Correction - Sex/Date of Birth',
  },
  'First Name': {
    applicationType: 'Birth Certificate',
    applicationSubtype: 'Correction - First Name',
  },
};

const BirthCertificateForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
 const { getCurrentUserId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditing =
    location.state?.isEditing || localStorage.getItem('isEditingBirthApplication') === 'true';
  const editingApplicationId = localStorage.getItem('editingApplicationId');

  const showNotification = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

useEffect(() => {
  const fetchData = async () => {
    if (isEditing && editingApplicationId) {
      try {
        const backendApp = await documentApplicationService.getApplication(editingApplicationId);
        if (backendApp && backendApp.formData) {
          setFormData(backendApp.formData);
          // Store the original application subtype for reference during editing
          localStorage.setItem('originalApplicationSubtype', backendApp.applicationSubtype || '');
        } else if (backendApp) {
          setFormData(backendApp);
          localStorage.setItem('originalApplicationSubtype', backendApp.applicationSubtype || '');
        } else {
          showNotification('Could not load application for editing.', 'error');
        }
      } catch (err) {
        showNotification('There was a problem setting up edit mode. Please try again.', 'error');
      }
    } else {
      setFormData({});
      localStorage.removeItem('birthCertificateApplication');
      localStorage.removeItem('originalApplicationSubtype');
    }
  };
  fetchData();
}, [isEditing, editingApplicationId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Optionally update localStorage for draft support
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(
        'birthCertificateApplication',
        JSON.stringify({
          ...formData,
          [name]: type === 'checkbox' ? checked : value,
        })
      );
    }
  };

  const requiredFields = {
    1: [
      'lastName',
      'firstName',
      'birthMonth',
      'birthDay',
      'birthYear',
      'sex',
      'hospital',
      'city',
      'province',
      'barangay',
      'residence',
      'typeOfBirth',
      'birthOrder',
      'birthWeight',
    ],
    2: [
      'motherLastName',
      'motherFirstName',
      'motherCitizenship',
      'motherReligion',
      'motherTotalChildren',
      'motherLivingChildren',
      'motherDeceasedChildren',
      'motherOccupation',
      'motherAge',
      'motherStreet',
      'motherCity',
    ],
    3: [
      'fatherLastName',
      'fatherFirstName',
      'fatherCitizenship',
      'fatherReligion',
      'fatherOccupation',
      'fatherAge',
      'fatherStreet',
      'fatherBarangay',
      'fatherCity',
      'fatherProvince',
      'fatherCountry',
    ],
    4: [],
    5: [],
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 3 && formData.notAcknowledgedByFather) {
      return true;
    }
    requiredFields[step]?.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(prevStep => prevStep + 1);
  };

  const handlePrevious = () => setStep(prevStep => prevStep - 1);

const handleSubmit = async e => {
  if (e) e.preventDefault();
  if (!validateStep()) return;
  setIsLoading(true);

  try {
    // 1. Get current user ID from context
    const userId = getCurrentUserId && getCurrentUserId();

    // 2. Fetch latest user data from backend, fallback to localStorage
    let userData = {};
    if (userId) {
      try {
        userData = await userService.getUserById(userId);
      } catch (err) {
        showNotification('Could not fetch user info, using local data.', 'warning');
        userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      }
    } else {
      userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    }

    // 3. Use userData for contact info
    const userEmail = userData.email || '';
    const userPhone = userData.contactNumber || userData.phoneNumber || '';
    const username = userData.username || '';
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';
    const fullName = userData.name || `${firstName} ${lastName}`.trim();

    let applicationId = editingApplicationId;
    let routeOption;

    if (isEditing && editingApplicationId) {
      try {
        const originalApplication = await documentApplicationService.getApplication(editingApplicationId);
        const originalSubtype = originalApplication.applicationSubtype ||
          originalApplication.formData?.applicationSubtype ||
          localStorage.getItem('originalApplicationSubtype');
        const subtypeToRouteMap = {
          'Regular Application (0-1 month)': 'Regular application',
          'Delayed Registration - Above 18': 'Above 18',
          'Delayed Registration - Below 18': 'Below 18',
          'Delayed Registration - Foreign Parent': 'Foreign Parent',
          'Delayed Registration - Out of Town': 'Out of town',
          'Correction - Clerical Errors': 'Clerical Error',
          'Correction - Sex/Date of Birth': 'Sex DOB',
          'Correction - First Name': 'First Name'
        };
        routeOption = subtypeToRouteMap[originalSubtype] || 'Regular application';
      } catch (error) {
        routeOption = 'Regular application';
      }
    } else {
      routeOption = sessionStorage.getItem('selectedBirthCertificateOption') || 'Regular application';
    }

    const backendType = backendTypeMap[routeOption] || backendTypeMap['Regular application'];

    // Enhanced form data with user contact information
    const enhancedFormData = {
      ...formData,
      userEmail,
      userPhone,
      username,
      applicantFullName: fullName,
      submissionDate: new Date().toISOString()
    };

    let backendResponse;
    if (isEditing && editingApplicationId) {
      backendResponse = await documentApplicationService.updateApplication(editingApplicationId, {
        formData: enhancedFormData,
        applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`,
        applicationType: backendType.applicationType,
        applicationSubtype: backendType.applicationSubtype,
        userEmail,
        userPhone,
        username,
        applicantFullName: fullName,
        lastUpdated: new Date().toISOString(),
      });
      applicationId = backendResponse.id || editingApplicationId;
      showNotification('Application updated successfully', 'success');
    } else {
      applicationId = 'BC-' + Date.now().toString().slice(-6);
      const backendApplicationData = {
        applicationType: backendType.applicationType,
        applicationSubtype: backendType.applicationSubtype,
        applicantName: `${formData.firstName || ''} ${formData.lastName || ''}`,
        formData: enhancedFormData,
        userEmail,
        userPhone,
        username,
        applicantFullName: fullName,
        status: 'PENDING',
        submissionDate: new Date().toISOString(),
      };
      backendResponse = await documentApplicationService.createApplication(backendApplicationData);
      if (!backendResponse || !backendResponse.id)
        throw new Error('Backend did not return a valid application ID');
      applicationId = backendResponse.id;
      showNotification('Application created successfully', 'success');
    }

    // LocalStorage update (for offline/fallback)
    const existingApplications = JSON.parse(localStorage.getItem('applications') || '[]');
    const appIndex = existingApplications.findIndex(app => app.id === applicationId);
    const applicationData = {
      id: applicationId,
      type: backendType.applicationType,
      applicationType: backendType.applicationType,
      applicationSubtype: backendType.applicationSubtype,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }),
      status: isEditing
        ? localStorage.getItem('currentApplicationStatus') || 'Pending'
        : 'Pending',
      message: `Birth Certificate application for ${formData.firstName || ''} ${formData.lastName || ''}`,
      formData: enhancedFormData,
      userEmail,
      userPhone,
      username,
      applicantFullName: fullName,
      lastUpdated: new Date().toISOString(),
    };

    if (appIndex >= 0) {
      existingApplications[appIndex] = applicationData;
    } else {
      existingApplications.push(applicationData);
    }
    localStorage.setItem('applications', JSON.stringify(existingApplications));
    localStorage.setItem('currentApplicationId', applicationId);
    localStorage.setItem('birthCertificateApplication', JSON.stringify(enhancedFormData));

    // Clean up edit flags
    if (isEditing) {
      localStorage.removeItem('isEditingBirthApplication');
      localStorage.removeItem('editingApplicationId');
      localStorage.removeItem('editingApplication');
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(
      new CustomEvent('customStorageUpdate', {
        detail: {
          id: applicationId,
          type: backendType.applicationType,
          action: isEditing ? 'updated' : 'created',
        },
      })
    );

    // Route map
    const routeMap = {
      'Regular application': '/BirthApplicationSummary',
      'Request copy': '/RequestACopyBirthCertificate',
      'Above 18': '/Above18Registration',
      'Below 18': '/Below18Registration',
      'Foreign Parent': '/DelayedOneParentForeignerRegistration',
      'Out of town': '/DelayedOutOfTownRegistration',
      'Clerical Error': '/ClericalErrorApplication',
      'Sex DOB': '/SexDobCorrection',
      'First Name': '/FirstNameCorrection',
    };
    navigate(routeMap[routeOption] || '/BirthApplicationSummary');
  } catch (err) {
    if (err.response && err.response.data) {
      showNotification(err.response.data.message || 'Error submitting application', 'error');
    } else {
      showNotification(
        'There was a problem submitting your application. Please try again.',
        'error'
      );
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <Box className="BirthCertificateFormContainer">
      <Typography variant="h4" className="BirthCertificateFormTitle">
        <Box className="FormTitleHeader">
          <Button
            variant="outlined"
            className="back-button-home-form"
            onClick={() => navigate('/ApplicationForm')}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          <span className="FormTitleText">Birth Certificate Application Form</span>
        </Box>
      </Typography>

      <Paper className="BirthCertificateForm" elevation={3}>
        {step === 1 && (
          <>
            <ChildIdentifyingForm formData={formData} handleChange={handleChange} errors={errors} />
            <Button variant="contained" onClick={handleNext} className="BirthCertificateFormButton">
              Next
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <MotherInformationBirthForm
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
            <Button
              variant="contained"
              onClick={handlePrevious}
              className="BirthCertificateFormButton"
            >
              Previous
            </Button>
            <Button variant="contained" onClick={handleNext} className="BirthCertificateFormButton">
              Next
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <FatherInformationBirthForm
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
            <Button
              variant="contained"
              onClick={handlePrevious}
              className="BirthCertificateFormButton"
            >
              Previous
            </Button>
            <Button variant="contained" onClick={handleNext} className="BirthCertificateFormButton">
              Next
            </Button>
          </>
        )}
        {step === 4 && (
          <>
            <MarriageInformationBirthForm
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
            <Button
              variant="contained"
              onClick={handlePrevious}
              className="BirthCertificateFormButton"
            >
              Previous
            </Button>
            <Button variant="contained" onClick={handleNext} className="BirthCertificateFormButton">
              Next
            </Button>
          </>
        )}
        {step === 5 && (
          <>
            <AffidavitBirthForm formData={formData} handleChange={handleChange} />
            <Button
              variant="contained"
              onClick={handlePrevious}
              className="BirthCertificateFormButton"
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              className="BirthCertificateFormButton"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        )}
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BirthCertificateForm;
