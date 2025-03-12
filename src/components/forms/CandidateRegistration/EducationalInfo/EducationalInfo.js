import { Box, Grid, Typography } from "@mui/material";
import React from "react";
import InputBoxComponent from "../../../atoms/InputBoxComponent/InputBoxComponent";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

const EducationalInfo = ({
  educationalDetailsArray,
  setEducationalDetailsArray,
  handleEducationDetailsAddButtonError,
  educationDetailsError
}) => {
  const handleInputChange = (e, i) => {
    const { name, value } = e.target;
    const list = [...educationalDetailsArray];
    list[i][name] = value;
    setEducationalDetailsArray(list);
  };

  // console.log("educationalDetailsArray", educationalDetailsArray);
  return (
    <Box>
      <Box marginTop={2.5}>
        <Typography textAlign="center" variant="h4">
          Educational Details
        </Typography>
        {educationalDetailsArray.map((val, i) => {
          return (
            <Grid marginTop={4} container key={i}>
              <Grid item xs={11}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <InputBoxComponent
                      label="Qualification"
                      value={val.level}
                      name="level"
                      onChange={(e) => handleInputChange(e, i)}
                      helperText={
                        educationDetailsError[i]?.level
                          ? educationDetailsError[i].level
                          : ""
                      }
                      error={educationDetailsError[i]?.level
                        ? educationDetailsError[i].level
                        : ""}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InputBoxComponent
                      label="Institute Name"
                      value={val.instituteName}
                      name="instituteName"
                      onChange={(e) => handleInputChange(e, i)}
                      helperText={
                        educationDetailsError[i]?.instituteName
                          ? educationDetailsError[i].instituteName
                          : ""
                      }
                      error={educationDetailsError[i]?.instituteName
                        ? educationDetailsError[i].instituteName
                        : ""}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InputBoxComponent
                      label="Percentage or Cgpa"
                      value={val.percentage}
                      name="percentage"
                      onChange={(e) => handleInputChange(e, i)}
                      helperText={
                        educationDetailsError[i]?.percentage
                          ? educationDetailsError[i].percentage
                          : ""
                      }
                      error={educationDetailsError[i]?.percentage
                        ? educationDetailsError[i].percentage
                        : ""}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InputBoxComponent
                      label="Year of passout"
                      value={val.yop}
                      name="yop"
                      onChange={(e) => handleInputChange(e, i)}
                      helperText={
                        educationDetailsError[i]?.yop
                          ? educationDetailsError[i].yop
                          : ""
                      }
                      error={educationDetailsError[i]?.yop
                        ? educationDetailsError[i].yop
                        : ""}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={1}>
                <Box
                  sx={{ width: "100%", height: "100%", marginLeft: 2 }}
                  justifyContent="flex-start"
                  alignItems="center"
                  display="flex"
                  onChange={(e) => handleInputChange(e, i)}
                >
                  <Box>
                    {educationalDetailsArray.length - 1 === i ? (
                      <AddCircleOutlineIcon
                        sx={{ cursor: "pointer" }}
                        fontSize="medium"
                        color="primary"
                        onClick={() => {
                          handleEducationDetailsAddButtonError(i);
                          // const tempArray = [...educationalDetailsArray];
                          // tempArray.push({
                          //   level: "",
                          //   instituteName: "",
                          //   percentage: "",
                          //   yop: "",
                          // });
                          // setEducationalDetailsArray([...tempArray]);
                        }}
                      />
                    ) : (
                      <RemoveCircleOutlineIcon
                        sx={{ cursor: "pointer" }}
                        fontSize="medium"
                        color="primary"
                        onClick={() => {
                          const tempArray = [...educationalDetailsArray];
                          tempArray.splice(i, 1);
                          setEducationalDetailsArray([...tempArray]);
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          );
        })}
      </Box>
    </Box>
  );
};

export default EducationalInfo;
