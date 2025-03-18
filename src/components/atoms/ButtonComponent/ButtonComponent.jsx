import { Button } from "@mui/material";
import { makeStyles } from "@mui/styles";
import DeleteIcon from "@mui/icons-material/Delete";

const useStyles = makeStyles({
  root: {
    " &:disabled": {
      backgroundColor: "#706c61",
      color: "white",
    },

  },
});

const ButtonComponent = ({
  label = "",
  variant = "contained",
  onBtnClick = () => {},
  size = "small",
  borderRadius = "4px",
  textColor = "color-white",
  bgColor = "bg-btn-blue",
  fullWidth = false,
  disabled = false,
  children,
  paddingX= 3,
  paddingY=1,
  // component = "",
  // iconPosition = "start",
  // icon = <DeleteIcon />,
  // showIcon = false,
  sx = {},
  onMouseLeave = () => {},
  onMouseEnter = () => {},
  type="button"
}) => {
  const classes = useStyles();

  // let IconProp = showIcon
  //   ? iconPosition === "start"
  //     ? {
  //         startIcon: icon,
  //       }
  //     : { endIcon: icon }
  //   : {};

  return (
    <Button
      variant={variant}
      onClick={onBtnClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      size={size}
      className={`${
        disabled === true
          ? classes.root
          : // eslint-disable-next-line no-nested-ternary
          variant === "contained"
          ? `${bgColor} ${textColor}`
          : variant === "outlined"
          ? `${textColor}`
          : variant === "text"
          ? `${textColor}`
          : ""
      } `}
      sx={{
        textTransform: "capitalize",
        borderRadius: { borderRadius },
        paddingX: paddingX,
        paddingY: paddingY,
        ...sx,
      }}
      fullWidth={fullWidth}
      disabled={disabled}
      disableRipple
      disableFocusRipple
      disableElevation
      type={type}
    >
      {label}
      {children}
    </Button>
  );
};

export default ButtonComponent;
