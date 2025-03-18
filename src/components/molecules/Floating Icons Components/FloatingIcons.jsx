import { Box } from '@mui/material'
import React, { useState, useEffect, useRef } from 'react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CallIcon from '@mui/icons-material/Call';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import "./FloatingIcons.css"
import ScrollToHome from './ScrollToHome';
import {animateScroll as scroll } from 'react-scroll';




function FloatingIcons() {
    const [isScrolled, setIsScrolled] = useState(false);
  const threshold = 4250; // Adjust this value as needed

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      
    };
   
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const whatsappStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    // color: isScrolled ? '#06065abd' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };
  const callStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    // color: isScrolled ? '#06065abd' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };

  const arrowStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    display:isScrolled?"block":"none",
    color: isScrolled ? '#06065abd' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };

  let scrollToTop=()=>
    {
      scroll.scrollToTop()
    }

  return (
    <Box className="floating-icons">
       <a href="https://wa.me/919611224400?text=Welcome%20to%20Rest%20Coder%20Academy.You%20may%20ask%20your%20queries%20here." target='_blank'>
       <WhatsAppIcon fontSize='large' className='whatsapp'  style={whatsappStyle}/>
       </a>
       <a href="tel:+919611224400">
            <CallIcon fontSize='large' className='call'  style={callStyle}/>
       </a>
        <ArrowUpwardIcon fontSize='large' className='arrow'  style={arrowStyle} onClick={scrollToTop}/>
    </Box>
  )
}

export default FloatingIcons
