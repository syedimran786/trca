import React, { useEffect } from "react";
import ModalComponent from "../../molecules/ModalComponent";
import { useState } from "react";
import DropdownComponent from "../../atoms/DropdownComponent/DropdownComponent";
import { getBatchesForMappingTheTrainer } from "../../../services/trainermodule/trainermodule";
import { Box } from "@mui/material";

const MapTrainerModalComponent = ({
  openMapTrainerModal,
  batchesForDropdown,
  setBatchesForDropdown,
  setOpenMapTrainerModal,
  setMapTrainerDetails,
  mapTrainerDetails,
  mapTrainer,
}) => {
  const getBatches = async () => {
    const { data, error } = await getBatchesForMappingTheTrainer();
    if (data) {
      if (data.error) {
      } else {
        const tempArray = data.data.map((val) => {
          return { id: val.batchId, label: val.batchName };
        });
        setBatchesForDropdown([...tempArray]);
      }
    } else if (error) {
    }
  };

  const [dropDownValue, setDropDownValue] = useState({
    id: "",
    label: "",
  });

  useEffect(() => {
    getBatches();
  }, []);

  const handleSubmitClick = async () => {
    await mapTrainer();
    setOpenMapTrainerModal(false);
    setDropDownValue({ id: "", label: "" });
  };

  const handleClose = () => {
    setOpenMapTrainerModal(false);
    setDropDownValue({
      id: "",
      label: "",
    });
  };

  return (
    <ModalComponent
      showClearBtn={false}
      modalWidth={400}
      open={openMapTrainerModal}
      onCancelBtnClick={() => {
        handleClose();
      }}
      onCloseBtnClick={() => {
        handleClose();
      }}
      onSubmitBtnClick={handleSubmitClick}
    >
      <Box paddingY={3} paddingX={3}>
        <DropdownComponent
          label="Available Batches"
          options={batchesForDropdown}
          onChange={(val) => {
            setMapTrainerDetails({ ...mapTrainerDetails, batchId: val?.id });
            setDropDownValue({ ...val });
          }}
          value={dropDownValue}
        />
      </Box>
    </ModalComponent>
  );
};

export default MapTrainerModalComponent;
