import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import { Tooltip } from "@mui/material";
import ButtonComponent from "../../atoms/ButtonComponent/ButtonComponent";

const ModalComponent = ({
  type = "",
  children,
  modalTitle = "Modal Title",
  modalWidth = 750,
  showFooter = true,
  showHeader = true,
  showCloseIcon = true,
  minHeightClassName = "mnh-400",
  maxHeightClassName = "mxh-400p",
  height = "",
  showCancelBtn = true,
  showSubmitBtn = true,
  showClearBtn = true,
  cancelBtnLabel = "Cancel",
  submitBtnLabel = "Submit",
  clearBtnLabel = "Clear All",
  onCancelBtnClick = () => {},
  onClearBtnClick = () => {},
  onCloseBtnClick = onCancelBtnClick,
  onSubmitBtnClick = () => {},
  open = true,
  headerTextColor = "#1181B2",
  submitBtnDisabled = false,
}) => {
  const styles = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: modalWidth,
    border: "0.5px solid #9FCCE0",
    borderRadius: "13px",
    boxShadow: "0px 0px 20px #9FCCE066",
    background: "#FCFEFF !important",
  };

  return (
    <>
      <Modal
        open={open}
        disableAutoFocus
        disableEnforceFocus
        disableEscapeKeyDown
      >
        <Box sx={styles}>
          {showHeader && (
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              paddingY={2}
              paddingX={2}
              style={{ borderBottom: "1px solid #9FCCE0" }}
            >
              <label
                className="modal-title ff-Ro fw-500"
                style={{
                  overflowX: "auto",
                  color: type === "alert" ? "red" : headerTextColor,
                }}
              >
                {modalTitle}
              </label>
              <Box className={showCloseIcon ? "" : "d-none"}>
                <Tooltip title="Close" onClick={onCloseBtnClick}>
                  <CloseIcon
                    style={{ cursor: "pointer", borderRadius: "2px" }}
                    sx={{
                      "&:hover": { color: "#0F6F9A", background: "#F1F8FB" },
                      color: "#A6A6A6",
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
          )}
          <Box
            className={` ${height} ${maxHeightClassName} overflowY-scroll overflowX-hidden website-scroll-bar `}
          >
            {children}
          </Box>
          {showFooter && (
            <Box
              display={"flex "}
              justifyContent={"end"}
              paddingY={2}
              paddingX={4}
              marginBottom={2}
            >
              {showClearBtn && (
                <Box>
                  <ButtonComponent
                    onBtnClick={onClearBtnClick}
                    label={clearBtnLabel}
                    variant="outlined"
                    bgColor="cancelbtn-text"
                    textColor="cancelbtn-text "
                    sx={{ marginX: "3px" }}
                  />
                </Box>
              )}
              {showCancelBtn && (
                <Box>
                  <ButtonComponent
                    onBtnClick={onCancelBtnClick}
                    label={cancelBtnLabel}
                    variant="outlined"
                    bgColor="cancelbtn-text"
                    textColor="cancelbtn-text "
                    sx={{ marginX: "3px" }}
                  />
                </Box>
              )}
              {showSubmitBtn && (
                <Box>
                  <ButtonComponent
                    onBtnClick={onSubmitBtnClick}
                    label={submitBtnLabel}
                    textColor="submitbtn-text "
                    bgColor="submitbtn-bg"
                    disabled={submitBtnDisabled}
                    sx={{ marginX: "3px" }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default ModalComponent;
