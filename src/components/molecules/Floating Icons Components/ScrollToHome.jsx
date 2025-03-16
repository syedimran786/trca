import React from 'react'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {animateScroll as scroll } from 'react-scroll';


function ScrollToHome() {

    let scrollToTop=()=>
    {
   
        scroll.scrollToTop()
    }
  return (
  <ArrowUpwardIcon fontSize='large' className='arrow1' onClick={scrollToTop}/>
  )
}

export default ScrollToHome
