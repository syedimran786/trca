import { Box, Typography,Grid, Paper } from '@mui/material';
import React, { useState } from 'react'
import InputBoxComponent from '../../atoms/InputBoxComponent/InputBoxComponent';
import TextAreaComponent from '../../atoms/TextAreaComponent/TextAreaComponent';
import DropdownComponent from '../../atoms/DropdownComponent/DropdownComponent';
import "./EnquiryForm.css"
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { useAuth } from '../../../App';

function EnquiryForm() {
    let {closeModal}=useAuth()

    let [enquiryData,setenquiryData]=useState({fullname:"",mobile:"",email:"",experience:"",message:""})
    let  options =[
        { label: "Working professional - Technical roles", id: 1 },
        { label: "Working professional - Non technical", id: 2 },
        { label: "College student - Final year", id: 3 },
        { label: "College student - 1st to pre-final year", id: 4 },
        { label: "Others", id: 5 }]
    

let changeEnquiryData=({target:{name,value}})=>
{
    setenquiryData({...enquiryData,[name]:value})
}
let changeDropDown=(value)=>
{
    setenquiryData({...enquiryData,experience: value.label})
}
    

  return (
    <Box   className="enquiry-form">
      <Box className="form-heading">
        <TypoGraphyComponent
          component="h6"
          variant="h6"
            text="Enquire Now"
        //   text="Login"
        />
       <ButtonComponent
       paddingX={1}
       paddingY={1}
            onBtnClick={closeModal}
          >
           X
          </ButtonComponent>
      </Box>

      <Box className="enquiry-fields" p={2}>
        <Box className="enquiry-field">
          <InputBoxComponent
            value={enquiryData.fullname}
            label="Full Name"
            variant="outlined"
            onChange={changeEnquiryData}
            name="fullname"
            error={""}
            helperText={""}
          />
        </Box>
        <Box className="enquiry-field">
          <InputBoxComponent
            value={enquiryData.mobile}
            label="Mobile"
            variant="outlined"
            onChange={changeEnquiryData}
            name="mobile"
            error={""}
            helperText={""}
          />
        </Box>
        <Box className="enquiry-field">
          <InputBoxComponent
            value={enquiryData.email}
            label="Email"
            variant="outlined"
            onChange={changeEnquiryData}
            name="email"
            error={""}
            helperText={""}
          />
        </Box>
        <Box className="enquiry-field">
          <DropdownComponent
            label="Experience"
            options={options}
            name="experience"
            onChange={changeDropDown}
            value={options}
          />
        </Box>
        <Box className="enquiry-field">
          <TextAreaComponent
            className="text-area"
            label='Message'
            name="message"
            value={enquiryData.message}
            onChange={changeEnquiryData}
          />
        </Box>
        <Box className="enquiry-field-button">
          <ButtonComponent
            variant="contained"
            bgColor="bg-btn-blue"
            borderRadius="0px"
            paddingX={1.5}
            paddingY={0.7}
          >
            Submit
          </ButtonComponent>
        </Box>
      </Box>
    </Box>
  );
}

export default EnquiryForm
