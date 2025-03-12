import { Box, Grid, Typography } from "@mui/material";
import React, { useState } from "react";
import InputBoxComponent from "../../../atoms/InputBoxComponent/InputBoxComponent";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DropdownComponent from "../../../atoms/DropdownComponent/DropdownComponent";

const TechnicalSkills = ({
  technicalSkillsArray,
  setTechnicalSkillsArray,
  handleTechnicalSkillsAddButtonError,
  technicalSkillsError,
}) => {
  const handleInputChange = (e, i) => {
    const { name, value } = e.target;
    const list = [...technicalSkillsArray];
    list[i][name] = value;
    setTechnicalSkillsArray(list);
  };

  let handleRatingDropDown = (val, i) => {
    const tempRating = [...technicalSkillsArray];
    tempRating[i].rating = val;
    setTechnicalSkillsArray([...tempRating]);
  };

  return (
    <Box>
      <Box marginTop={2.5}>
        <Typography textAlign="center" variant="h4">
          Technical Skills
        </Typography>
        {technicalSkillsArray.map((val, i) => {
          return (
            <Grid marginTop={4} container>
              <Grid item xs={11}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <InputBoxComponent
                      label="Skill"
                      name="skill"
                      value={val.skill}
                      onChange={(e) => handleInputChange(e, i)}
                      helperText={
                        technicalSkillsError[i]?.skill
                          ? technicalSkillsError[i].skill
                          : ""
                      }
                      error={technicalSkillsError[i]?.skill
                        ? technicalSkillsError[i].skill
                        : ""}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DropdownComponent
                      options={[
                        { label: "Average", id: 1 },
                        { label: "Intermediate", id: 2 },
                        { label: "Good", id: 3 },
                      ]}
                      label="Rating"
                      value={val.rating}
                      onChange={(val) => handleRatingDropDown(val, i)}
                      helperText={
                        technicalSkillsError[i]?.rating
                          ? technicalSkillsError[i].rating
                          : ""
                      }
                      error={technicalSkillsError[i]?.rating
                        ? technicalSkillsError[i].rating
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
                >
                  <Box>
                    {technicalSkillsArray.length - 1 === i ? (
                      <AddCircleOutlineIcon
                        sx={{ cursor: "pointer" }}
                        fontSize="medium"
                        color="primary"
                        onClick={() => {
                          handleTechnicalSkillsAddButtonError(i);
                        }}
                      />
                    ) : (
                      <RemoveCircleOutlineIcon
                        sx={{ cursor: "pointer" }}
                        fontSize="medium"
                        color="primary"
                        onClick={() => {
                          const tempArray = [...technicalSkillsArray];
                          tempArray.splice(i, 1);
                          setTechnicalSkillsArray([...tempArray]);
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

export default TechnicalSkills;
