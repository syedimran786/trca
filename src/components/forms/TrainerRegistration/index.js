import { Box, Grid } from "@mui/material";
import React, { useState } from "react";
import InputBoxComponent from "../../atoms/InputBoxComponent/InputBoxComponent";
import DropdownComponent from "../../atoms/DropdownComponent/DropdownComponent";
import MultiSelectComponent from "../../atoms/MultiSelectComponent/MultiSelectComponent";

function TrainerRegistration({
  trainerRegistrationForm,
  settrainerRegistrationForm,
  trainerRegistrationFormError,
}) {
  const [skillsList, setskillsList] = useState([
    { id: "HTML", title: "HTML", value: "HTML" },
    { id: "CSS", title: "CSS", value: "CSS" },
    { id: "Javascript", title: "Javascript", value: "Javascript" },
    { id: "React", title: "React", value: "React" },
    { id: "Java", title: "Java", value: "Java" },
    { id: "Sql", title: "Sql", value: "Sql" },
  ]);

  let { empid, empName, officialEmail, skills, phno, rating } =
    trainerRegistrationForm;

  const handleTextInputChange = (e) => {
    settrainerRegistrationForm({
      ...trainerRegistrationForm,
      [e.target.name]: e.target.value,
    });
  };

  let handleRatingDropDown = (val) => {
    const tempRating = { ...trainerRegistrationForm };
    tempRating.rating = val;
    settrainerRegistrationForm(tempRating);
  };

  return (
    <Box marginX={3}>
      <Box marginTop={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <InputBoxComponent
              label="Employee ID"
              name="empid"
              value={empid}
              onChange={(e) => {
                handleTextInputChange(e);
              }}
              error={trainerRegistrationFormError.empid}
              helperText={trainerRegistrationFormError.empid}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <InputBoxComponent
              label="Employee name"
              name="empName"
              value={empName}
              onChange={(e) => {
                handleTextInputChange(e);
              }}
              error={trainerRegistrationFormError.empName}
              helperText={trainerRegistrationFormError.empName}
            />
          </Grid>
        </Grid>
      </Box>

      <Box className="mt-3" marginTop={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <InputBoxComponent
              label="Official email id"
              name="officialEmail"
              value={officialEmail}
              onChange={(e) => {
                handleTextInputChange(e);
              }}
              error={trainerRegistrationFormError.officialEmail}
              helperText={trainerRegistrationFormError.officialEmail}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MultiSelectComponent
              list={skillsList}
              label="Skills"
              name="skills"
              value={skills}
              onSelectionChange={(e, val) => {
                settrainerRegistrationForm({
                  ...trainerRegistrationForm,
                  skills: [...val],
                });
              }}
              error={trainerRegistrationFormError.skills}
              helperText={trainerRegistrationFormError.skills}
            />
          </Grid>
        </Grid>
      </Box>

      <Box className="mt-3" marginTop={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <InputBoxComponent
              label="Phone no."
              name="phno"
              value={phno}
              onChange={(e) => {
                handleTextInputChange(e);
              }}
              error={trainerRegistrationFormError.phno}
              helperText={trainerRegistrationFormError.phno}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DropdownComponent
              options={[
                { id: "Excellent", label: "Excellent" },
                { id: "Good", label: "Good" },
                { id: "Above Average", label: "Above Average" },
              ]}
              label="Rating"
              value={rating}
              name="rating"
              onChange={(val) => handleRatingDropDown(val)}
              error={trainerRegistrationFormError.rating}
              helperText={trainerRegistrationFormError.rating}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default TrainerRegistration;
