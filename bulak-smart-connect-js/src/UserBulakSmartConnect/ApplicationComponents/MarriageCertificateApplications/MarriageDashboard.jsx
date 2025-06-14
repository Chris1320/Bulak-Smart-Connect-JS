import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, FormControlLabel, Radio, RadioGroup, Button } from '@mui/material';
import './MarriageDashboard.css';
import NavBar from '../../../NavigationComponents/NavSide';

const MarriageDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [hasVisitedPrivacyPolicy, setHasVisitedPrivacyPolicy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const visited = sessionStorage.getItem('visitedPrivacyPolicy');
    if (visited === 'true') {
      setHasVisitedPrivacyPolicy(true);
    }
  }, []);

  const handlePrivacyPolicyClick = () => {
    // Open the privacy policy in a new window
    const policyWindow = window.open('/PrivacyPolicy', '_blank');

    // Set up a listener to detect when the window is closed
    if (policyWindow) {
      const checkClosed = setInterval(() => {
        if (policyWindow.closed) {
          clearInterval(checkClosed);
          sessionStorage.setItem('visitedPrivacyPolicy', 'true');
          setHasVisitedPrivacyPolicy(true);
        }
      }, 1000);
    }
  };

  const handleNext = () => {
    if (!selectedOption) {
      alert('Please select an application type before proceeding.');
      return;
    }

    if (!agreedPrivacy || !agreedTerms) {
      alert('You must agree to the Data Privacy Notice and Terms and Conditions to proceed.');
      return;
    }
    localStorage.setItem('selectedMarriageOption', selectedOption);
    navigate('/MarriageForm');
  };

  return (
    <Box className={`ContainerMDashboard ${isSidebarOpen ? 'sidebar-openMDashboard' : ''}`}>
      <NavBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <Typography variant="h4" className="TitleMDashboard">
        Marriage Application
      </Typography>
      
      <Paper className="PaperMDashboard" elevation={3}>
        <Box className="SectionMDashboard">
          <Typography variant="h6" className="SectionTitleMDashboard">
            Applying for:
          </Typography>
          
          <RadioGroup
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="RadioGroupMDashboard"
          >
            <FormControlLabel
              value="Marriage License"
              control={<Radio />}
              label="Application for Marriage License"
              className="RadioMDashboard"
            />
            
            <FormControlLabel
              value="Marriage Certificate"
              control={<Radio />}
              label="Application for Marriage Certificate"
              className="RadioMDashboard"
            />
          </RadioGroup>
        </Box>

        <Box className="SectionMDashboard">
          <Typography variant="h6" className="SectionTitleMDashboard">
            Data Privacy Notice
          </Typography>
          
          <Box sx={{ mb: 2 }} className="dataPrivacyNoticeMDashboard">
            <Typography variant="body2" sx={{ mb: 1 }} className="dataPrivacyNoticeMDashboard">
              Please <strong>click</strong> and <strong>read </strong> our{' '}
              <Button
                variant="text"
                color="primary"
                onClick={handlePrivacyPolicyClick}
                sx={{ p: 0, textTransform: 'none', textDecoration: 'underline' }}
                className="dataPrivacyNoticeLinkMDashboard"
              >
                Data Privacy Policy
              </Button>{' '}
              before proceeding. |{' '}
              <span className="Privacy-TagalogNoticeMDashboard">
                Pindutin at basahin ang aming{' '}
                <Button
                  variant="text"
                  color="primary"
                  onClick={handlePrivacyPolicyClick}
                  sx={{ p: 0, textTransform: 'none', textDecoration: 'underline' }}
                  className="dataPrivacyNoticeLinkMDashboard"
                >
                  Patakaran sa Pagkapribado ng Data
                </Button>{' '}
                bago magpatuloy.
              </span>
            </Typography>
            {!hasVisitedPrivacyPolicy && (
              <Typography variant="body2" color="error">
                You must read the Privacy Policy before you can agree.
              </Typography>
            )}
          </Box>
          
          <FormControlLabel
            control={
              <Radio 
                checked={agreedPrivacy}
                onChange={() => setAgreedPrivacy(!agreedPrivacy)}
                disabled={!hasVisitedPrivacyPolicy}
              />
            }
            label={
              <Typography
                variant="body1"
                color={!hasVisitedPrivacyPolicy ? 'text.disabled' : 'text.primary'}
              >
                I agree to the Data Privacy Notice | Sumasang-ayon ako sa Data Privacy Notice
              </Typography>
            }
            className="RadioMDashboard"
          />
        </Box>

        <Box className="SectionMDashboard">
          <Typography variant="h6" className="SectionTitleMDashboard">
            Terms and Condition
          </Typography>
          
          <FormControlLabel
            control={
              <Radio
                checked={agreedTerms}
                onChange={() => setAgreedTerms(!agreedTerms)}
              />
            }
            label={
              <Box>
                <Typography>I agree to the terms and conditions</Typography>
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  sumasang-ayon ako sa mga termino at kondition
                </Typography>
              </Box>
            }
            className="RadioMDashboard"
          />
        </Box>

        <Box className="SectionMDashboard">
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!selectedOption || !agreedPrivacy || !agreedTerms || !hasVisitedPrivacyPolicy}
            className="NextButtonMDashboard"
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MarriageDashboard;