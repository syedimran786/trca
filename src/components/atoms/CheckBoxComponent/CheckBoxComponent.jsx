import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Checkbox from "@mui/material/Checkbox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { FormControlLabel } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
// import makeStyles from "@mui/styles/makeStyles";

// const useStyles = makeStyles({
//   root: {
//     "& .MuiFormControlLabel-label": {
//       fontSize: "10px",
//     },
//   },
// });

const CheckBoxComponent = ({
  label = "",
  isChecked = false,
  isDisabled = false,
  indeterminate = false,
  checkBoxClick = () => {},
  size = "small",
  varient = "normal", //  filled or normal
  showIcon = false,
  iconType = "normal", // normal or circled
  id = "checkbox",
  className = "",
  diableLabelClick = true,
  checkedcolor = "#e56700",
  labelColor = "",
  lableFontSize = "",
  lableFontWeight = "",
}) => {
  // const classes = useStyles();

  const getIcon = () => {
    if (showIcon && iconType === "normal" && varient === "filled") {
      return <CheckBoxIcon />;
    }
    if (showIcon && iconType === "circled") {
      return <RadioButtonUncheckedIcon />;
    }
    return <CheckBoxOutlineBlankIcon />;
  };

  const getCheckIcon = () => {
    if (showIcon && iconType === "circled") {
      return <CheckCircleIcon />;
    }
    return <CheckBoxIcon />;
  };

  return (
    <div>
      <FormControlLabel
        label={label}
        style={{
          pointerEvents: diableLabelClick && "none",
          fontWeight: lableFontWeight,
          fontSize: lableFontSize,
          color: labelColor,
        }}
        // classes={{ root: classes.root }}
        control={
          <Checkbox
            id={id}
            label={label}
            checked={isChecked}
            icon={getIcon()}
            checkedIcon={getCheckIcon()}
            sx={{
              "&.Mui-checked": {
                color: checkedcolor,
              },
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            disabled={isDisabled}
            indeterminate={indeterminate}
            onChange={(e) => {
              e.stopPropagation();
              checkBoxClick(e.target.id, e.target.checked);
            }}
            size={size}
            className={className}
          />
        }
      />
    </div>
  );
};

export default CheckBoxComponent;
