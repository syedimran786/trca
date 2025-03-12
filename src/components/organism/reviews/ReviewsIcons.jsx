import React from 'react'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

import {Box} from '@mui/material'
import { LinkedIn, YouTube } from '@mui/icons-material';

function MentorIcons() {
  return (
    <Box className="icons">
        <a href="">
        <FacebookIcon className='facebook-icon' />
        </a>
        <a href="">
        <InstagramIcon className='instagram-icon'/>
        </a>
        <a href="">
        <LinkedIn className='linkedin-icon'/>
        </a>
    </Box>
  )
}

export default MentorIcons
