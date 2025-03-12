import React from "react";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Box, Typography } from "@mui/material";

const RadioButton = ({
  checked = false,
  handleChange = () => {},
  value = "",
  label = "",
}) => {
  return (
    <Box display="flex" alignItems="center">
      <Typography>{label}</Typography>
      <Radio
        checked={checked}
        onChange={handleChange}
        value={value}
        //   name="radio-buttons"
        //   inputProps={{ "aria-label": "A" }}
      />
    </Box>
  );
};

export default RadioButton;
