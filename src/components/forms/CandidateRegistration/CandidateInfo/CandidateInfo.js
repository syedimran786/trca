import React, { useState } from "react";
import InputBoxComponent from "../../../atoms/InputBoxComponent/InputBoxComponent";
import { Box, Grid, Typography } from "@mui/material";
import RadioButton from "../../../atoms/RadioButton/RadioButton";
import DropdownComponent from "../../../atoms/DropdownComponent/DropdownComponent";
import DatePickerComponent from "../../../atoms/DatePickerComponent/DatePickerComponent";
import MultiSelectComponent from "../../../atoms/MultiSelectComponent/MultiSelectComponent";
import { LogoDevOutlined } from "@mui/icons-material";

const CandidateInfo = ({
  candidateInfoFormData,
  setCandidateInfoFormData,
  candidateJspidersDetails,
  setCandidateJspidersDetails,
  experienceDetails,
  setExperienceDetails,
  candidateInfoError,
  jspiderDetailsError,
  experienceDetailsError,
}) => {
  const {
    candidateName,
    gender,
    officialMailId,
    contactNumber,
    dateOfBirth,
    bloodGroup,
    panNumber,
    adhaarNumber,
    highestQualification,
    trainedInJspider,
    haveAnExperience,
  } = candidateInfoFormData;

  const { joiningDate, branchName, technologiesLearned, isCourseCompleted } =
    candidateJspidersDetails;

  const {
    totalExperience,
    companyName,
    joiningDateInCompany,
    releavingDate,
    designation,
    technicalSkills,
  } = experienceDetails;

  const handleTextInputChange = (e) => {
    setCandidateInfoFormData({
      ...candidateInfoFormData,
      [e.target.name]: e.target.value,
    });
  };

  // console.log(adhaarNumber, "---adhaarNumber");

  // console.log(technologiesLearned, "---technologiesLearned");

  // console.log(
  //   `${dateOfBirth.getFullYear()}-${
  //     dateOfBirth.getMonth() + 1 >= 10
  //       ? dateOfBirth.getMonth() + 1
  //       : `0${dateOfBirth.getMonth() + 1}`
  //   }-${
  //     dateOfBirth.getDate() >= 10
  //       ? dateOfBirth.getDate()
  //       : `0${dateOfBirth.getDate()}`
  //   }`
  // );

  return (
    <Box paddingX={5} marginBottom={3}>
      <Box marginTop={2}>
        <Typography textAlign="center" variant="h4">
          Candidate Info
        </Typography>
      </Box>
      <Grid marginTop={1} container spacing={2}>
        <Grid item xs={6} md={4}>
          <InputBoxComponent
            value={candidateName}
            label="Candidate Name"
            variant="outlined"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            name="candidateName"
            error={candidateInfoError.candidateName}
            helperText={candidateInfoError.candidateName}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <DropdownComponent
            options={[
              { label: "Male", id: 1 },
              { label: "Female", id: 2 },
              { label: "Other", id: 3 },
            ]}
            label="Gender"
            onChange={(val) => {
              console.log(val);
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                gender: { ...val },
              });
            }}
            value={gender}
            error={candidateInfoError.gender}
            helperText={candidateInfoError.gender}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <InputBoxComponent
            value={officialMailId}
            name="officialMailId"
            label="Official Mail Id"
            variant="outlined"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateInfoError.officialMailId}
            helperText={candidateInfoError.officialMailId}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <InputBoxComponent
            value={contactNumber}
            name="contactNumber"
            label="Contact Number"
            variant="outlined"
            onChange={(e) => handleTextInputChange(e)}
            error={candidateInfoError.contactNumber}
            helperText={candidateInfoError.contactNumber}
            type="number"
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <DatePickerComponent
            inputlabelshrink
            label="Date Of Birth"
            size="small"
            onDateChange={(val) => {
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                dateOfBirth: val,
              });
            }}
            value={dateOfBirth}
            error={candidateInfoError.dateOfBirth}
            helperText={candidateInfoError.dateOfBirth}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <DropdownComponent
            label="Blood Group"
            options={[
              { label: "A+", id: 1 },
              { label: "A-", id: 2 },
              { label: "B+", id: 3 },
              { label: "B-", id: 4 },
              { label: "AB+", id: 5 },
              { label: "AB-", id: 6 },
              { label: "O+", id: 7 },
              { label: "O-", id: 8 },
            ]}
            onChange={(val) => {
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                bloodGroup: { ...val },
              });
            }}
            value={bloodGroup}
            error={candidateInfoError.bloodGroup}
            helperText={candidateInfoError.bloodGroup}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <InputBoxComponent
            value={panNumber}
            name="panNumber"
            label="Pan Number"
            variant="outlined"
            onChange={(e) => handleTextInputChange(e)}
            error={candidateInfoError.panNumber}
            helperText={candidateInfoError.panNumber}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <InputBoxComponent
            value={adhaarNumber}
            name="adhaarNumber"
            label="Adhaar Number"
            variant="outlined"
            onChange={(e) => handleTextInputChange(e)}
            error={candidateInfoError.adhaarNumber}
            helperText={candidateInfoError.adhaarNumber}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <InputBoxComponent
            value={highestQualification}
            name="highestQualification"
            label="Highest Qualification"
            variant="outlined"
            onChange={(e) => handleTextInputChange(e)}
            error={candidateInfoError.highestQualification}
            helperText={candidateInfoError.highestQualification}
          />
        </Grid>
      </Grid>

      <Box marginTop={3}>
        <Typography fontWeight="bold">Were you trained in Jspiders</Typography>
        <Box display="flex">
          <RadioButton
            handleChange={() => {
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                trainedInJspider: true,
              });
            }}
            checked={trainedInJspider}
            label="Yes"
          />
          <RadioButton
            handleChange={() => {
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                trainedInJspider: false,
              });
            }}
            checked={!trainedInJspider}
            label="No"
          />
        </Box>
      </Box>
      {trainedInJspider && (
        <Box marginTop={1}>
          <Grid spacing={2} container>
            <Grid xs={6} item>
              <DatePickerComponent
                size="small"
                inputlabelshrink
                label="Joining Date"
                value={joiningDate}
                onDateChange={(val) => {
                  setCandidateJspidersDetails({
                    ...candidateJspidersDetails,
                    joiningDate: val,
                  });
                }}
                error={jspiderDetailsError.joiningDate}
                helperText={jspiderDetailsError.joiningDate}
              />
            </Grid>
            <Grid xs={6} item>
              <InputBoxComponent
                name="branchName"
                value={branchName}
                onChange={(e) => {
                  setCandidateJspidersDetails({
                    ...candidateJspidersDetails,
                    branchName: e.target.value,
                  });
                }}
                label="Branch Name"
                error={jspiderDetailsError.branchName}
                helperText={jspiderDetailsError.branchName}
              />
            </Grid>
            <Grid xs={6} item>
              <MultiSelectComponent
                list={[
                  { title: "Java", value: "Java", id: 1 },
                  { title: "Sql", value: "Sql", id: 2 },
                  { title: "HTML", value: "HTML", id: 3 },
                  { title: "CSS", value: "CSS", id: 4 },
                  { title: "Javascript", value: "Javascript", id: 5 },
                ]}
                label="Technologies Learned"
                value={technologiesLearned}
                onSelectionChange={(e, val) => {
                  setCandidateJspidersDetails({
                    ...candidateJspidersDetails,
                    technologiesLearned: [...val],
                  });
                }}
                error={jspiderDetailsError.technologiesLearned}
                helperText={jspiderDetailsError.technologiesLearned}
              />
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center">
                <Typography fontWeight="bold">
                  Is your course completed
                </Typography>
                <Box display="flex" marginLeft={2}>
                  <RadioButton
                    handleChange={() => {
                      setCandidateJspidersDetails({
                        ...candidateJspidersDetails,
                        isCourseCompleted: true,
                      });
                    }}
                    checked={isCourseCompleted}
                    label="Yes"
                  />
                  <RadioButton
                    handleChange={() => {
                      setCandidateJspidersDetails({
                        ...candidateJspidersDetails,
                        isCourseCompleted: false,
                      });
                    }}
                    checked={!isCourseCompleted}
                    label="No"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box marginTop={3}>
        <Typography fontWeight="bold">Do you have experience</Typography>
        <Box display="flex">
          <RadioButton
            handleChange={() => {
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                haveAnExperience: true,
              });
            }}
            checked={haveAnExperience}
            label="Yes"
          />
          <RadioButton
            handleChange={() => {
              setCandidateInfoFormData({
                ...candidateInfoFormData,
                haveAnExperience: false,
              });
            }}
            checked={!haveAnExperience}
            label="No"
          />
        </Box>

        {haveAnExperience && (
          <Box marginTop={1}>
            <Grid spacing={2} container>
              <Grid item xs={6}>
                <InputBoxComponent
                  value={totalExperience}
                  type="number"
                  label="Total Experience"
                  onChange={(e) => {
                    setExperienceDetails({
                      ...experienceDetails,
                      totalExperience: e.target.value,
                    });
                  }}
                  error={experienceDetailsError.totalExperience}
                  helperText={experienceDetailsError.totalExperience}
                />
              </Grid>
              <Grid item xs={6}>
                <InputBoxComponent
                  value={companyName}
                  onChange={(e) => {
                    setExperienceDetails({
                      ...experienceDetails,
                      companyName: e.target.value,
                    });
                  }}
                  label="Company Name"
                  error={experienceDetailsError.companyName}
                  helperText={experienceDetailsError.companyName}
                />
              </Grid>
              <Grid xs={6} item>
                <DatePickerComponent
                  size="small"
                  inputlabelshrink
                  label="Joining Date"
                  value={joiningDateInCompany}
                  onDateChange={(val) => {
                    setExperienceDetails({
                      ...experienceDetails,
                      joiningDateInCompany: val,
                    });
                  }}
                  error={experienceDetailsError.joiningDateInCompany}
                  helperText={experienceDetailsError.joiningDateInCompany}
                />
              </Grid>
              <Grid xs={6} item>
                <DatePickerComponent
                  size="small"
                  inputlabelshrink
                  label="Releaving Date"
                  value={releavingDate}
                  onDateChange={(val) => {
                    setExperienceDetails({
                      ...experienceDetails,
                      releavingDate: val,
                    });
                  }}
                  error={experienceDetailsError.releavingDate}
                  helperText={experienceDetailsError.releavingDate}
                />
              </Grid>
              <Grid item xs={6}>
                <InputBoxComponent
                  value={designation}
                  onChange={(e) => {
                    setExperienceDetails({
                      ...experienceDetails,
                      designation: e.target.value,
                    });
                  }}
                  label="Designation"
                  error={experienceDetailsError.designation}
                  helperText={experienceDetailsError.designation}
                />
              </Grid>
              <Grid item xs={6}>
                <MultiSelectComponent
                  list={[
                    { title: "Java", value: "Java", id: 1 },
                    { title: "Sql", value: "Sql", id: 2 },
                    { title: "HTML", value: "HTML", id: 3 },
                    { title: "CSS", value: "CSS", id: 4 },
                    { title: "Javascript", value: "Javascript", id: 5 },
                    { title: "React", value: "React", id: 6 },
                  ]}
                  label="Technical Skills"
                  value={technicalSkills}
                  onSelectionChange={(e, val) => {
                    setExperienceDetails({
                      ...experienceDetails,
                      technicalSkills: [...val],
                    });
                  }}
                  error={experienceDetailsError.technicalSkills}
                  helperText={experienceDetailsError.technicalSkills}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CandidateInfo;
