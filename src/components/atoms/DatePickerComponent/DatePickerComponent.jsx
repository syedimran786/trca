import * as React from "react";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { createTheme, ThemeProvider } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const DatePickerComponent = ({
  label = "",
  fullWidth = true,
  size = "medium",
  disableFuture = false,
  value = null,
  onDateChange = () => {},
  error = false,
  helperText = null,
  inputlabelshrink = false,
  required = false,
  className = "",
  disabled = false,
}) => {
  const theme = createTheme({
    components: {
      MuiFormLabel: {
        styleOverrides: {
          asterisk: { color: "red", fontWeight: 700, fontSize: 22 },
        },
      },
    },
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <DatePicker
          label={label}
          value={value}
          disableFuture={disableFuture}
          fullWidth={fullWidth}
          onChange={(newData) => onDateChange(new Date(newData))}
          // inputFormat="dd/MM/yyyy"
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth={fullWidth}
              size={size}
              InputLabelProps={{
                shrink: inputlabelshrink || value,
              }}
              error={Boolean(error)}
              helperText={helperText}
              required={required}
              className={className}
            />
          )}
          errorText={error}
          disabled={disabled}
        />
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default DatePickerComponent;
