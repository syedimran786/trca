import React from 'react'
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';


function FooterLocation() {
  return (
    <>
        <TypoGraphyComponent variant='h5' component='h5'  text="Location"/>
       <TypoGraphyComponent variant='body2' component='a'>
               <LocationOnIcon className='map-icon' fontSize='large'/>
        </TypoGraphyComponent>
    </>
  )
}

export default FooterLocation
