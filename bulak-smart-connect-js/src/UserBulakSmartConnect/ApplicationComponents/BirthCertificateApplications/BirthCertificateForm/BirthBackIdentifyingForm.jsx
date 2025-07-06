import React, { useState } from 'react';
import './BirthBackIdentifyingForm.css';

const AffidavitBirthForm = ({ formData, handleChange, isReadOnly = false }) => {
  const requiredField = <span className="RequiredFieldAffidavit">*</span>;

  const getChildFullName = () => {
    const firstName = formData?.firstName || '';
    const middleName = formData?.middleName || '';
    const lastName = formData?.lastName || '';
    const extension = formData?.extension || '';

    let fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    if (extension) fullName += ' ' + extension;

    return fullName;
  };

  const geFatherFullName = () => {
    if (formData?.maritalStatus === "marital" || formData?.fatherLastName == null) {
      return '';
    }

    const FatherfirstName = formData?.fatherFirstName || '';
    const FathermiddleName = formData?.fatherMiddleName || '';
    const FatherlastName = formData?.fatherLastName || '';
    const Fatherextension = formData?.fatherExtension || '';

    let FatherfullName = [FatherfirstName, FathermiddleName, FatherlastName]
      .filter(Boolean)
      .join(' ');
    if (Fatherextension) FatherfullName += ' ' + Fatherextension;

    return FatherfullName;
  };

  const getMotherFullName = () => {
    const MotherfirstName = formData?.motherFirstName || '';
    const MothermiddleName = formData?.motherMiddleName || '';
    const MotherlastName = formData?.motherLastName || '';
    const Motherextension = formData?.motherExtension || '';

    let MotherfullName = [MotherfirstName, MothermiddleName, MotherlastName]
      .filter(Boolean)
      .join(' ');
    if (Motherextension) MotherfullName += ' ' + Motherextension;

    return MotherfullName;
  };

  const getChildBirthDate = () => {
    const month = formData?.birthMonth || '';
    const day = formData?.birthDay || '';
    const year = formData?.birthYear || '';

    if (month && day && year) {
      return `${month} ${day}, ${year}`;
    }
    return '';
  };
const getChildBirthPlace = () => {
  const hospital = formData?.hospital || '';
  const city = formData?.city || '';
  const province = formData?.province || '';
  
  let birthPlace = [];
  if (hospital) birthPlace.push(hospital);
  if (city) birthPlace.push(city);
  if (province) birthPlace.push(province);
  
  return birthPlace.join(', ');
};

  const [registrationType, setRegistrationType] = useState('self');
  const [parentStatus, setParentStatus] = useState(null);
  const [maritalStatus, setMaritalStatus] = useState(formData?.maritalStatus || 'single');
  const [autoFill, setAutoFill] = useState(false);

  const handleRegistrationTypeChange = type => {
    setRegistrationType(type);
    
    if (type === 'self' && autoFill) {
      handleChange({
        target: {
          name: 'selfBirthPlace',
          value:  getChildBirthPlace() ,
        }
      });
      handleChange({
        target: {
          name: 'selfBirthDate',
          value: getChildBirthDate(),
        }
      });
      
      // Clear other fields
      handleChange({
        target: {
          name: 'otherPersonName',
          value: '',
        }
      });
      handleChange({
        target: {
          name: 'otherBirthPlace',
          value: '',
        }
      });
      handleChange({
        target: {
          name: 'otherBirthDate',
          value: '',
        }
      });
    } else if (type === 'other' && autoFill) {
      handleChange({
        target: {
          name: 'otherPersonName',
          value: getChildFullName(),
        }
      });
      handleChange({
        target: {
          name: 'otherBirthPlace',
          value: getChildBirthPlace(),
        }
      });
      handleChange({
        target: {
          name: 'otherBirthDate',
          value: getChildBirthDate(),
        }
      });
      
      // Clear self fields
      handleChange({
        target: {
          name: 'selfBirthPlace',
          value: '',
        }
      });
      handleChange({
        target: {
          name: 'selfBirthDate',
          value: '',
        }
      });
    }
  };

  const handleParentStatusChange = status => {
  // If clicking the already selected checkbox, deselect it
  if (parentStatus === status) {
    setParentStatus(null);
    
    // Clear fields based on which option was deselected
    if (status === 'married') {
      handleChange({
        target: {
          name: 'marriageDate',
          value: ''
        }
      });
      handleChange({
        target: {
          name: 'marriagePlace',
          value: ''
        }
      });
    } else if (status === 'notMarried') {
      handleChange({
        target: {
          name: 'fatherName',
          value: ''
        }
      });
    }
    return;
  }
  
  // Otherwise, select the clicked checkbox
  setParentStatus(status);
  
  if (status === 'married' && autoFill) {
    handleChange({
      target: {
        name: 'marriageDate',
        value: (formData?.marriageMonth && formData?.marriageDay && formData?.marriageYear)
          ? `${formData.marriageMonth} ${formData.marriageDay}, ${formData.marriageYear}`
          : formData?.marriageDate || ''
      }
    });
    handleChange({
      target: {
        name: 'marriagePlace',
        value: (formData?.marriageCity && formData?.marriageProvince)
          ? `${formData.marriageCity}, ${formData.marriageProvince}`
          : formData?.marriagePlace || ''
      }
    });
    
    // Clear not married fields
    handleChange({
      target: {
        name: 'fatherName',
        value: ''
      }
    });
  } else if (status === 'notMarried' && autoFill) {
    handleChange({
      target: {
        name: 'fatherName',
        value: (formData?.fatherFirstName && formData?.fatherLastName)
          ? `${formData.fatherFirstName} ${formData.fatherMiddleName || ''} ${formData.fatherLastName}`
          : formData?.fatherName || ''
      }
    });
    
    // Clear married fields
    handleChange({
      target: {
        name: 'marriageDate',
        value: ''
      }
    });
    handleChange({
      target: {
        name: 'marriagePlace',
        value: ''
      }
    });
  }
};

  const handleMaritalStatusChange = status => {
    setMaritalStatus(status);
    handleChange({
      target: {
        name: 'maritalStatus',
        value: status,
      },
    });
  };

  const handleAutoFillToggle = () => {
    setAutoFill(!autoFill);

    if (!autoFill) {
      // Auto-fill based on currently selected registration type
      if (registrationType === 'self') {
        handleChange({
          target: {
            name: 'selfBirthPlace',
            value:  getChildBirthPlace(),
          }
        });
        handleChange({
          target: {
            name: 'selfBirthDate',
            value: getChildBirthDate(),
          }
        });
      } else if (registrationType === 'other') {
        handleChange({
          target: {
            name: 'otherPersonName',
            value: getChildFullName(),
          }
        });
        handleChange({
          target: {
            name: 'otherBirthPlace',
            value: getChildBirthPlace(),
          }
        });
        handleChange({
          target: {
            name: 'otherBirthDate',
            value: getChildBirthDate(),
          }
        });
      }

      // Auto-fill based on currently selected parent status
      if (parentStatus === 'married') {
        handleChange({
          target: {
            name: 'marriageDate',
            value: (formData?.marriageMonth && formData?.marriageDay && formData?.marriageYear)
              ? `${formData.marriageMonth} ${formData.marriageDay}, ${formData.marriageYear}`
              : formData?.marriageDate || ''
          }
        });
        handleChange({
          target: {
            name: 'marriagePlace',
            value: (formData?.marriageCity && formData?.marriageProvince)
              ? `${formData.marriageCity}, ${formData.marriageProvince}`
              : formData?.marriagePlace || ''
          }
        });
      } else if (parentStatus === 'notMarried') {
        handleChange({
          target: {
            name: 'fatherName',
            value: (formData?.fatherFirstName && formData?.fatherLastName)
              ? `${formData.fatherFirstName} ${formData.fatherMiddleName || ''} ${formData.fatherLastName}`
              : formData?.fatherName || ''
          }
        });
      }
    }
  };

  const shouldShowPaternityAffidavit = () => {
    if (formData.ParentsMarriage == "marital" || formData?.fatherLastName == '') {
      return false;
    }
    return true;
  };

  return (
    <div className="BirthFormContainerAffidavit">
      {shouldShowPaternityAffidavit() && (
        <>
          <div className="FormHeaderAffidavit">AFFIDAVIT OF ACKNOWLEDGMENT/ADMISSION OF PATERNITY</div>
          <div className="SubHeaderAffidavit">(For births before 3 August 1988)</div>
          <div className="FormContentAffidavit">
            <div className="FormSectionAffidavit">
              <div className="FormRowAffidavit">
                <div className="AffidavitText">
                  I/We,
                  <input
                    type="text"
                    name="affiantName1"
                    value={formData?.affiantName1 || geFatherFullName()}
                    onChange={handleChange}
                    className="AffidavitUnderlineInput"
                  />
                  and
                  <input
                    type="text"
                    name="affiantName2"
                    value={formData?.affiantName2 || getMotherFullName()}
                    onChange={handleChange}
                    className="AffidavitUnderlineInput"
                  />
                  , who was born on
                  <input
                    type="text"
                    name="affiantBirthDate"
                    value={formData?.affiantBirthDate || ''}
                    onChange={handleChange}
                    className="AffidavitUnderlineInput"
                  />
                  at
                  <input
                    type="text"
                    name="affiantBirthPlace"
                    value={formData?.affiantBirthPlace || ''}
                    onChange={handleChange}
                    className="AffidavitUnderlineInput"
                  />
                  of legal age, am/are the natural mother and/or father of
                  <input
                    type="text"
                    name="childFullName"
                    value={formData?.childFullName || getChildFullName()}
                    onChange={handleChange}
                    className="AffidavitUnderlineInput"
                  />
                  .
                </div>
              </div>
              <div className="FormRowAffidavit">
                <div className="AffidavitText">
                  I am / We are executing this affidavit to attest to the truthfulness of the foregoing
                  statements and for purposes of acknowledging my/our child.
                </div>
              </div>
              <div className="FormRowAffidavit">
                <div className="SignatureBlockAffidavit">
                  <div className="SignatureLine"></div>
                  <div className="SignatureCaption">(Signature Over Printed Name of Father)</div>
                </div>
                <div className="SignatureBlockAffidavit">
                  <div className="SignatureLine"></div>
                  <div className="SignatureCaption">(Signature Over Printed Name of Mother)</div>
                </div>
              </div>
              <div className="FormRowAffidavit">
                <div className="AffidavitText">
                  <strong>SUBSCRIBED AND SWORN</strong> to before me this
                  <input
                    type="text"
                    name="swornDay1"
                    value={formData?.swornDay1 || ''}
                    onChange={handleChange}
                    className="AffidavitShortInput1"
                    disabled={true}
                  />
                  day of
                  <input
                    type="text"
                    name="swornMonth1"
                    value={formData?.swornMonth1 || ''}
                    onChange={handleChange}
                    className="AffidavitMediumInput1"
                    disabled={true}
                  />
                  ,
                  <input
                    type="text"
                    name="swornYear1"
                    value={formData?.swornYear1 || ''}
                    onChange={handleChange}
                    className="AffidavitShortInput1"
                    disabled={true}
                  />
                  , by
                  <input
                    type="text"
                    name="swornBy1"
                    value={formData?.swornBy1 || ''}
                    onChange={handleChange}
                    className="AffidavitMediumInput1"
                    disabled={true}
                  />
                  , who exhibited to me (his/her) CTC/valid ID
                  <input
                    type="text"
                    name="validID1"
                    value={formData?.validID1 || ''}
                    onChange={handleChange}
                    className="AffidavitMediumInput1"
                    disabled={true}
                  />
                  issued on
                  <input
                    type="text"
                    name="idIssueDate1"
                    value={formData?.idIssueDate1 || ''}
                    onChange={handleChange}
                    className="AffidavitMediumInput1"
                    disabled={true}
                  />
                  at
                  <input
                    type="text"
                    name="idIssuePlace1"
                    value={formData?.idIssuePlace1 || ''}
                    onChange={handleChange}
                    className="AffidavitMediumInput1"
                    disabled={true}
                  />
                  .
                </div>
              </div>
              <div className="FormRowAffidavit">
                <div className="SignatureBlockAffidavit">
                  <div className="SignatureLine"></div>
                  <div className="SignatureCaption">Signature of the Administering Officer</div>
                  <div className="SignatureLine"></div>
                  <div className="SignatureCaption">Name in Print</div>
                </div>
                <div className="SignatureBlockAffidavit">
                  <div className="SignatureLine"></div>
                  <div className="SignatureCaption">Position / Title / Designation</div>
                  <div className="SignatureLine"></div>
                  <div className="SignatureCaption">Address</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="FormHeaderAffidavit">AFFIDAVIT FOR DELAYED REGISTRATION OF BIRTH</div>
      <div className="SubHeaderAffidavit">
        (To be accomplished by the hospital/clinic administrator, father, mother, or guardian of the
        person himself if 18 years old or over.)
      </div>

      <div className="FormContentAffidavit">
        <div className="FormSectionAffidavit">
          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              I,
              <input
                type="text"
                name="delayedAffiantName"
                value={formData?.delayedAffiantName || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              , of legal age,
              <span className="MaritalStatusOptions">
                <span className="CheckboxContainerAffidavit MaritalStatusCheckbox">
                  <input
                    type="checkbox"
                    id="singleCheckbox"
                    checked={maritalStatus === 'single'}
                    onChange={() => handleMaritalStatusChange('single')}
                    className="CheckboxInputAffidavit"
                    disabled={isReadOnly}
                  />
                  <label htmlFor="singleCheckbox" className="CheckboxLabelAffidavit">
                    single
                  </label>
                </span>
                <span className="CheckboxContainerAffidavit MaritalStatusCheckbox">
                  <input
                    type="checkbox"
                    id="marriedCheckbox"
                    checked={maritalStatus === 'married'}
                    onChange={() => handleMaritalStatusChange('married')}
                    className="CheckboxInputAffidavit"
                    disabled={isReadOnly}
                  />
                  <label htmlFor="marriedCheckbox" className="CheckboxLabelAffidavit">
                    married
                  </label>
                </span>
                <span className="CheckboxContainerAffidavit MaritalStatusCheckbox">
                  <input
                    type="checkbox"
                    id="divorcedCheckbox"
                    checked={maritalStatus === 'divorced'}
                    onChange={() => handleMaritalStatusChange('divorced')}
                    className="CheckboxInputAffidavit"
                    disabled={isReadOnly}
                  />
                  <label htmlFor="divorcedCheckbox" className="CheckboxLabelAffidavit">
                    divorced
                  </label>
                </span>
                <span className="CheckboxContainerAffidavit MaritalStatusCheckbox">
                  <input
                    type="checkbox"
                    id="widowCheckbox"
                    checked={maritalStatus === 'widow'}
                    onChange={() => handleMaritalStatusChange('widow')}
                    className="CheckboxInputAffidavit"
                    disabled={isReadOnly}
                  />
                  <label htmlFor="widowCheckbox" className="CheckboxLabelAffidavit">
                    widow
                  </label>
                </span>
                <span className="CheckboxContainerAffidavit MaritalStatusCheckbox">
                  <input
                    type="checkbox"
                    id="widowerCheckbox"
                    checked={maritalStatus === 'widower'}
                    onChange={() => handleMaritalStatusChange('widower')}
                    className="CheckboxInputAffidavit"
                    disabled={isReadOnly}
                  />
                  <label htmlFor="widowerCheckbox" className="CheckboxLabelAffidavit">
                    widower
                  </label>
                </span>
              </span>
              , with residence and postal address at
              <input
                type="text"
                name="delayedAffiantAddress"
                value={formData?.delayedAffiantAddress || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              after having been duly sworn in accordance with law, do hereby depose and say:
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              1. That I am the applicant for the delayed registration of:
            </div>
          </div>

         <div className="FormRowAffidavit">
  <div className="CheckboxContainerAffidavit">
    <input
      type="checkbox"
      id="selfBirthCheckbox"
      checked={registrationType === 'self'}
      onChange={() => handleRegistrationTypeChange('self')}
      className="CheckboxInputAffidavit"
      disabled={isReadOnly}
    />
    <label htmlFor="selfBirthCheckbox" className="CheckboxLabelAffidavit">
      my birth in
      <input
        type="text"
        name="selfBirthPlace"
        value={registrationType == 'self'? getChildBirthPlace():''}
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={registrationType !== 'self' || isReadOnly}
      />
      on
      <input
        type="text"
        name="selfBirthDate"
        value={registrationType == 'self'? getChildBirthDate():''}
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={registrationType !== 'self' || isReadOnly}
      />
      .
    </label>
  </div>
</div>

<div className="FormRowAffidavit">
  <div className="CheckboxContainerAffidavit">
    <input
      type="checkbox"
      id="otherBirthCheckbox"
      checked={registrationType === 'other'}
      onChange={() => handleRegistrationTypeChange('other')}
      className="CheckboxInputAffidavit"
      disabled={isReadOnly}
    />
    <label htmlFor="otherBirthCheckbox" className="CheckboxLabelAffidavit">
      the birth of
      <input
        type="text"
        name="otherPersonName"
        value={registrationType === 'other' ? formData?.otherPersonName || getChildFullName() : ''}
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={registrationType !== 'other' || isReadOnly}
      />
      who was born in
      <input
        type="text"
        name="otherBirthPlace"
        value={registrationType === 'other' ? formData?.otherBirthPlace || getChildBirthPlace() : ''}
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={registrationType !== 'other' || isReadOnly}
      />
      on
      <input
        type="text"
        name="otherBirthDate"
        value={registrationType === 'other' ? formData?.otherBirthDate || getChildBirthDate() : ''}
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={registrationType !== 'other' || isReadOnly}
      />
      .
    </label>
  </div>
</div>
          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              2. That I/he/she was attended at birth by
              <input
                type="text"
                name="attendedBy"
                value={formData?.attendedBy || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              who resides at
              <input
                type="text"
                name="attendantAddress"
                value={formData?.attendantAddress || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              .
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              3. That I am/he/she is a citizen of
              <input
                type="text"
                name="citizenship"
                value={formData?.citizenship || formData?.motherCitizenship || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              .
            </div>
          </div>

          <div className="FormRowAffidavit">
         <div className="FormRowAffidavit">
  <div className="AffidavitText">4. That my/his/her parents were</div>
</div>

<div className="FormRowAffidavit">
  <div className="CheckboxContainerAffidavit">
    <input
      type="checkbox"
      id="marriedParentsCheckbox"
      checked={parentStatus === 'married'}
      onChange={() => handleParentStatusChange('married')}
      className="CheckboxInputAffidavit"
      disabled={isReadOnly}
    />
    <label htmlFor="marriedParentsCheckbox" className="CheckboxLabelAffidavit">
      married on
      <input
        type="text"
        name="marriageDate"
        value={parentStatus === 'married' ? 
          (formData?.marriageMonth && formData?.marriageDay && formData?.marriageYear
            ? `${formData.marriageMonth} ${formData.marriageDay}, ${formData.marriageYear}`
            : formData?.marriageDate || '') : ''
        }
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={parentStatus !== 'married'}
      />
      at
      <input
        type="text"
        name="marriagePlace"
        value={parentStatus === 'married' ?
          (formData?.marriageCity && formData?.marriageProvince
            ? `${formData.marriageCity}, ${formData.marriageProvince}`
            : formData?.marriagePlace || '') : ''
        }
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={parentStatus !== 'married'}
      />
      .
    </label>
  </div>
</div>

<div className="FormRowAffidavit">
  <div className="CheckboxContainerAffidavit">
    <input
      type="checkbox"
      id="notMarriedParentsCheckbox"
      checked={parentStatus === 'notMarried'}
      onChange={() => handleParentStatusChange('notMarried')}
      className="CheckboxInputAffidavit"
      disabled={isReadOnly}
    />
    <label htmlFor="notMarriedParentsCheckbox" className="CheckboxLabelAffidavit">
      not married but I/he/she was acknowledged/not acknowledged by my/his/her father
      whose name is
      <input
        type="text"
        name="fatherName"
        value={parentStatus === 'notMarried' ? 
          (formData?.fatherFirstName && formData?.fatherLastName
            ? `${formData.fatherFirstName} ${formData.fatherMiddleName || ''} ${formData.fatherLastName}`
            : formData?.fatherName || '') : ''
        }
        onChange={handleChange}
        className="AffidavitMediumInput"
        disabled={parentStatus !== 'notMarried'}
      />
      .
    </label>
  </div>
</div>
            </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              5. That the reason for the delay in registering my/his/her birth was
              <input
                type="text"
                name="delayReason"
                value={formData?.delayReason || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              .
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              6. (For the applicant only) That I am married to
              <input
                type="text"
                name="spouseName"
                value={formData?.spouseName || ''}
                onChange={handleChange}
                className="AffidavitLongInput"
              />
              .
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              (If the applicant is other than the document owner) That I am the
              <input
                type="text"
                name="relationshipToOwner"
                value={formData?.relationshipToOwner || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              of the said person.
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              7. That I am executing this affidavit to attest to the truthfulness of the foregoing
              statements for all legal intents and purposes.
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              In truth whereof, I have affixed my signature below this
              <input
                type="text"
                name="signatureDay"
                value={formData?.signatureDay || ''}
                onChange={handleChange}
                className="AffidavitShortInput"
              />
              day of
              <input
                type="text"
                name="signatureMonth"
                value={formData?.signatureMonth || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              at
              <input
                type="text"
                name="signaturePlace"
                value={formData?.signaturePlace || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              , Philippines.
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="SignatureBlockAffidavit FullWidth">
              <div className="SignatureLine"></div>
              <div className="SignatureCaption">(Signature Over Printed Name of Affiant)</div>
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="AffidavitText">
              <strong>SUBSCRIBED AND SWORN</strong> to before me this
              <input
                type="text"
                name="swornDay2"
                value={formData?.swornDay2 || ''}
                onChange={handleChange}
                className="AffidavitShortInput"
              />
              day of
              <input
                type="text"
                name="swornMonth2"
                value={formData?.swornMonth2 || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              at
              <input
                type="text"
                name="swornPlace2"
                value={formData?.swornPlace2 || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              , Philippines, affiant who exhibited to me his/her CTC/valid ID
              <input
                type="text"
                name="validID2"
                value={formData?.validID2 || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              issued on
              <input
                type="text"
                name="idIssueDate2"
                value={formData?.idIssueDate2 || ''}
                onChange={handleChange}
                className="AffidavitShortInput"
              />
              at
              <input
                type="text"
                name="idIssuePlace2"
                value={formData?.idIssuePlace2 || ''}
                onChange={handleChange}
                className="AffidavitMediumInput"
              />
              .
            </div>
          </div>

          <div className="FormRowAffidavit">
            <div className="SignatureBlockAffidavit">
              <div className="SignatureLine"></div>
              <div className="SignatureCaption">Signature of the Administering Officer</div>
              <div className="SignatureLine"></div>
              <div className="SignatureCaption">Name in Print</div>
            </div>

            <div className="SignatureBlockAffidavit">
              <div className="SignatureLine"></div>
              <div className="SignatureCaption">Position / Title / Designation</div>
              <div className="SignatureLine"></div>
              <div className="SignatureCaption">Address</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffidavitBirthForm;