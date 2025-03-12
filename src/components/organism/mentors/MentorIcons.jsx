import React from 'react'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

import {Box} from '@mui/material'
import { LinkedIn, YouTube } from '@mui/icons-material';

function MentorIcons() {
  return (
    <Box className="icons">
        <a href="https://www.facebook.com/share/1B6z1EPq7d/?mibextid=wwXIfr" target="_blank">
        <FacebookIcon className='facebook-icon'  />
        </a>
        <a href="https://www.instagram.com/_udaypawar_?igsh=cmhwaDF4MmNlaGwy" target='_blank'>
        <InstagramIcon className='instagram-icon'/>
        </a>
        <a href="https://www.linkedin.com/in/uday-pawar-s-835920164?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target='_blank'>
        <LinkedIn className='linkedin-icon'/>
        </a>
       
    </Box>
  )
}

export default MentorIcons
