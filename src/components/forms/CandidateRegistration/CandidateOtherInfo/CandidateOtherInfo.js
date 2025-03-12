import { Box, Grid, Typography } from "@mui/material";
import React from "react";
import InputBoxComponent from "../../../atoms/InputBoxComponent/InputBoxComponent";
import TextAreaComponent from "../../../atoms/TextAreaComponent/TextAreaComponent";

const CandidateOtherInfo = ({
  candidateOtherDetails,
  setcandidateOtherDetails,
  candidateOtherInfoError,
}) => {
  const {
    fatherName,
    fatherContactNumber,
    motherName,
    motherContactNumber,
    personalEmailID,
    emergencyContactNumber,
    alternateEmergencyContactNumber,
    permanentAddress,
    temporaryAddress,
  } = candidateOtherDetails;

  const handleTextInputChange = (e) => {
    setcandidateOtherDetails({
      ...candidateOtherDetails,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <Box marginTop={2} paddingRight={2}>
      <Box marginTop={2.5}>
        <Typography textAlign="center" variant="h4">
          Candidate Other Details
        </Typography>
      </Box>
      <Grid marginTop={0.3} spacing={2} container>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Father Name"
            value={fatherName}
            name="fatherName"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.fatherName}
            helperText={candidateOtherInfoError.fatherName}
          />
        </Grid>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Father Contact Number"
            value={fatherContactNumber}
            name="fatherContactNumber"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.fatherContactNumber}
            helperText={candidateOtherInfoError.fatherContactNumber}
          />
        </Grid>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Mother Name"
            value={motherName}
            name="motherName"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.motherName}
            helperText={candidateOtherInfoError.motherName}
          />
        </Grid>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Mother Contact Number"
            value={motherContactNumber}
            name="motherContactNumber"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.motherContactNumber}
            helperText={candidateOtherInfoError.motherContactNumber}
          />
        </Grid>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Personal Email Address"
            value={personalEmailID}
            name="personalEmailID"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.personalEmailID}
            helperText={candidateOtherInfoError.personalEmailID}
          />
        </Grid>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Emergency Contact Number"
            value={emergencyContactNumber}
            name="emergencyContactNumber"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.emergencyContactNumber}
            helperText={candidateOtherInfoError.emergencyContactNumber}
          />
        </Grid>
        <Grid item xs={4}>
          <InputBoxComponent
            label="Alternative Emergency Contact Number"
            value={alternateEmergencyContactNumber}
            name="alternateEmergencyContactNumber"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.alternateEmergencyContactNumber}
            helperText={candidateOtherInfoError.alternateEmergencyContactNumber}
          />
        </Grid>
      </Grid>
      <Grid container marginTop={2} spacing={2}>
        <Grid item xs={12}>
          <InputBoxComponent
            cols={100}
            label="Permanent Address"
            value={permanentAddress}
            name="permanentAddress"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.permanentAddress}
            helperText={candidateOtherInfoError.permanentAddress}
          />
        </Grid>
        <Grid item xs={12}>
          <InputBoxComponent
            cols={100}
            label="Temporary Address"
            value={temporaryAddress}
            name="temporaryAddress"
            onChange={(e) => {
              handleTextInputChange(e);
            }}
            error={candidateOtherInfoError.temporaryAddress}
            helperText={candidateOtherInfoError.temporaryAddress}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidateOtherInfo;
