import { Box } from '@mui/material'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import React from 'react'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'




function FooterAddress() {
  let address=`#364, 3rd Floor, 16th Main, 4th T Block East, Pattabhirama Nagar, Jayanagar, Bengaluru, Karnataka 560041`
let contact=`Mobile: 8073762257`;
let email=`Email: restcoderacademy@gmail.com`;


  return (
    <>
        <TypoGraphyComponent variant='h5' component='h2'  text="Address"/>
        <TypoGraphyComponent variant='body2' component='p' text={address}/>
        <TypoGraphyComponent variant='body2' component='p' text={contact}/>
        <TypoGraphyComponent variant='body2' component='p' text={email}/>

        <Box className="footer-socials" sx={{mt:"0.75rem", display:"flex", gap:"0.75rem"}}>
          <a
            href="https://www.instagram.com/restcoderacademy/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rest Coder Academy on Instagram"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://www.linkedin.com/company/rest-coder-academy/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rest Coder Academy on LinkedIn"
          >
            <LinkedInIcon />
          </a>
        </Box>
    </>
  )
}

export default FooterAddress
