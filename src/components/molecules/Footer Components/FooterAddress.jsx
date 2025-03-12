import { Box ,TextField,InputAdornment} from '@mui/material'
import React from 'react'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'




function FooterAddress() {
  let address=`Keremane Sy No 6/8, Shivanahalli Village, Ragihalli Post, Jigani Hobli, Anekal Taluk, Bengaluru, Karnataka 560083, INDIA`
let contact=`Mobile: 9876543212`;
let email=`Email: training@gmail.com`;


  return (
    <>
        <TypoGraphyComponent variant='h5' component='h5'  text="Address"/>
        <TypoGraphyComponent variant='body2' component='p' text={address}/>
        <TypoGraphyComponent variant='body2' component='p' text={contact}/>
        <TypoGraphyComponent variant='body2' component='p' text={email}/>
       

        


    </>
  )
}

export default FooterAddress
