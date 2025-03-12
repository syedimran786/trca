import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import Styles from "./textareacomponent.module.css";

const TextAreaComponent = ({
  label = "",
  name = "",
  rows = 5,
  cols = 40,
  value = "",
  onChange = () => {},
  error = false,
  helperText = "",
}) => {
  const [textAreaFocussed, setTextAreaFocussed] = useState(false);
  return (
    <Box className={`${Styles.containerStyle}`}>
      <textarea
      // placeholder="Message"
        name={name}
        value={value}
        onChange={onChange}
        className={`${Styles.textarea}`}
        rows={rows}
        cols={cols}
        onFocus={() => {
          setTextAreaFocussed(true);
        }}
        onBlur={() => {
          setTextAreaFocussed(false);
        }}
        style={{ borderColor: error ? "#d32f2f" : "", paddingTop:"10px" }}
      />
      <Typography
        className={`${Styles.labelStyle}`}
        style={{
          color: textAreaFocussed
            ? error
              ? "#d32f2f"
              : "#2196f3"
            : error
            ? "#d32f2f"
            : "",
        }}
      >
        {label}
      </Typography>
      {error && (
        <Typography color="#d32f2f" fontSize={12}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default TextAreaComponent;
