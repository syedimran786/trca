import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { createTheme, ThemeProvider } from "@mui/material";
import TextField from "@mui/material/TextField";
import CheckBoxComponent from "../CheckBoxComponent/CheckBoxComponent";

const MultiSelectComponent = ({
  list = [],
  size = "small",
  inputlabelshrink = false,
  fullWidth = true,
  value = [],
  label = "abc",
  onSelectionChange = () => {},
  id = "tags-outlined",
  disabled = false,
  helperText = "",
  error = false,
  freeSolo = false,
  placeholder = "",
  required = false,
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
    <ThemeProvider theme={theme}>
      <Autocomplete
        multiple
        freeSolo={freeSolo}
        disabled={disabled}
        id={id}
        options={list}
        disableCloseOnSelect
        getOptionLabel={(option) => option.title}
        value={value}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        renderOption={(props, option, obj) => (
          <div className="d-flex" {...props}>
            <CheckBoxComponent
              checkedcolor="#1976d2"
              isChecked={obj.selected}
            />
            {option.title}
          </div>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            // endAdornment={{ display: "none" }}
            label={label}
            size={size}
            helperText={helperText}
            error={error}
            InputLabelProps={{
              shrink: inputlabelshrink || value,
            }}
            fullWidth={fullWidth}
            placeholder={placeholder}
            required={required}
          />
        )}
        onChange={(e, val) => {
          onSelectionChange(e, val, id);
        }}
      />
    </ThemeProvider>
  );
};

export default MultiSelectComponent;
