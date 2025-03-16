import { Box ,TextField,InputAdornment} from '@mui/material'
import React from 'react'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'




function FooterAddress() {
  let address=`No.58, 1st floor, 2nd cross, chikkaramaiah layout, near Sri Rama gas
godown, Varanasi main road, Ramamurthy Nagar, 560036`
let contact=`Mobile: 9611224400`;
let email=`Email: enquiry@restcoderacademy.com`;


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
