import React from 'react'
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';


function FooterLocation() {
  return (
    <>
        <TypoGraphyComponent variant='h5' component='h5'  text="Location"/>
       <a href="https://maps.app.goo.gl/XdZWt3oDzGUCL5KWA?g_st=iw" 
       target='_blank'>
               <LocationOnIcon className='map-icon' fontSize='large'/>
        </a>
    </>
  )
}

export default FooterLocation
