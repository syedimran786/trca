import { Box, Button, Typography } from "@mui/material";
import React from "react";
import Navbar from "../../molecules/Navbar/Navbar";
import Stepper from "../../molecules/Stepper/HorizontalLinearStepper";
import HorizontalLinearSterpper from "../../molecules/Stepper/HorizontalLinearStepper";
import CandidateInfo from "../../forms/CandidateRegistration/CandidateInfo/CandidateInfo";
import CandidateRegistration from "../../../pages/CandidateRegistration/CandidateRegistration";
import TrainerModule from "../../../pages/TrainerModule/TrainerModule";
import { RouterComponent } from "../../../routes/routes";

const Layout = () => {
  return (
    <Box>
      <Navbar />
      <RouterComponent />
    </Box>
  );
};

export default Layout;
