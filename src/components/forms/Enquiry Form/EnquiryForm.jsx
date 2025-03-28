import { Box, Typography,Grid, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react'
import InputBoxComponent from '../../atoms/InputBoxComponent/InputBoxComponent';
import TextAreaComponent from '../../atoms/TextAreaComponent/TextAreaComponent';
import DropdownComponent from '../../atoms/DropdownComponent/DropdownComponent';
import "./EnquiryForm.css"
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { useAuth } from '../../../App';
import { regex } from '../../../regex/regex';
import axios from 'axios';



function EnquiryForm() {

  let [enquiryData,setenquiryData]=useState({fullname:"",mobile:"",email:"",experience:"",message:""})
  // const { register, handleSubmit, watch, formState: { errors } , control, reset} = useForm();
  let [enquiryErrors,setenquiryErrors]=useState({})
  let [issubmit,setissubmit]=useState(false)

  let {closeModal,notify}=useAuth()

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
    
const handleSubmit = (e)=>
  {
    e.preventDefault();
    
    setenquiryErrors(
    validateEnquiryForm(enquiryData))
    setissubmit(true)
  };

  let sendEnquiry=async ()=>
  {
    try
    {
      // https://trcabe.onrender.com/enquiries/get/enquiries
      let response=await axios.post('https://trcabe.onrender.com/enquiries/create/enquiry',enquiryData)
      // await axios.post('http://localhost:4005/enquiries/create/enquiry',enquiryData)
    }
    catch(err)
    {
      console.log(err)
    }
  }

useEffect(()=>
{
  if(Object.keys(enquiryErrors).length===0 && issubmit)
    {
      sendEnquiry();
      notify(enquiryData.fullname);
      closeModal()
    }
},[enquiryErrors])


  let validateEnquiryForm=({fullname,mobile,email,experience,message})=>
  {
    let errors={}
    
    //! fullname
    if(!fullname)
    {
      errors.fullname="Full Name is Required"
    }
    else if(fullname.length<3)
    {
      errors.fullname="Full Name should be more than 3 characters"
    }
    else if(!regex.nameRegex.test(fullname))
    {
      errors.fullname="Full Name Should Contain Only Alphabets"
    }

    //! mobile
    if(!mobile)
      {
        errors.mobile="Mobile is Required"
      }
      else if(!regex.mobileRegex.test(mobile))
      {
        errors.mobile="Invalid Mobile Number"
      }

      //! email

      if(!email)
      {
        errors.email="Email is Required"
      }
      else if(!regex.emailRegex.test(email))
      {
        errors.email="Invalid Email Number"
      }

         //! experience
    if(!experience)
      {
        errors.experience="Experience is Required"
      }
      // else if(!regex.emailRegex.test(email))
      // {
      //   errors.email="Invalid Email Number"
      // }

      return errors;
  }
  return (
    <form   className="enquiry-form" onSubmit={handleSubmit}>
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
            error={enquiryErrors.fullname?true:false}
            helperText={enquiryErrors.fullname}
          />
        </Box>
        <Box className="enquiry-field">
          <InputBoxComponent
            value={enquiryData.mobile}
            label="Mobile"
            variant="outlined"
            onChange={changeEnquiryData}
            name="mobile"
            error={enquiryErrors.mobile?true:false}
            helperText={enquiryErrors.mobile}
          />
        </Box>
        <Box className="enquiry-field">
          <InputBoxComponent
            value={enquiryData.email}
            label="Email"
            variant="outlined"
            onChange={changeEnquiryData}
            name="email"
            error={enquiryErrors.email?true:false}
            helperText={enquiryErrors.email}
          />
        </Box>
        <Box className="enquiry-field">
          <DropdownComponent
            label="Experience"
            options={options}
            name="experience"
            onChange={changeDropDown}
            value={options}
            helperText={enquiryErrors.experience}
            error={enquiryErrors.experience?true:false}
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
            type="submit"
          >
            Submit
          </ButtonComponent>
        </Box>
      </Box>
     
    </form>
  );
}

export default EnquiryForm
