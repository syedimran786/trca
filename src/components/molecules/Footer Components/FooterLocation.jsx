import React from 'react'
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';


function FooterLocation() {
  return (
    <>
        <TypoGraphyComponent variant='h5' component='h5'  text="Location"/>
       <a href="https://www.google.com/maps/place/12%C2%B055'28.7%22N+77%C2%B035'17.4%22E/@12.9246426,77.5855904,17z/data=!3m1!4b1!4m4!3m3!8m2!3d12.9246426!4d77.5881653?hl=en&entry=ttu&g_ep=EgoyMDI1MDQxMy4wIKXMDSoASAFQAw%3D%3D" 
       target='_blank'>
               <LocationOnIcon className='map-icon' fontSize='large'/>
        </a>
    </>
  )
}

export default FooterLocation
