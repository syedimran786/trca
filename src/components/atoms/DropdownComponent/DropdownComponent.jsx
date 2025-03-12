import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import InputBoxComponent from "../InputBoxComponent/InputBoxComponent";
const DropdownComponent = ({
  label = "",
  options = [],
  fullWidth = true,
  width = "100%",
  onChange = () => {},
  value = { label: "", id: 1 },
  error = false,
  helperText = "",
  isOptionEqualTo = () => {},
}) => {
  console.log(value)
  return (
    <Autocomplete
      fullWidth={fullWidth}
      sx={{ width: width }}
      options={options}
      getOptionLabel={(option) => {
        return option.label || "";
      }}
      renderInput={(params) => (
        <InputBoxComponent
          helperText={helperText}
          error={error}
          label={label}
          params={params}
        />
      )}
      onChange={(_, val) => {
        onChange(val);
      }}
      // value={value.label}
      isOptionEqualToValue={(option, value) => {
        console.log(option.id, "---option.id", value.id, "---value.id");
        return option.id === value.id;
      }}
      // isOptionEqualToValue={(option, value) => {
      //   return (
      //     value.label === "" ||
      //     option.id === value.id ||
      //     value.label === option.label
      //   );
      // }}
    />
  );
};

export default DropdownComponent;
