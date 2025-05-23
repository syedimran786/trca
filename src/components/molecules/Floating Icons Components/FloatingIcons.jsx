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

    //! for four cards in batches and courses use below value
  // const threshold = 3200; // Adjust this value as needed
  const threshold = 2700; // Adjust this value as needed


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
       <a href="https://wa.me/918073762257?text=Hello!%20Can%20I%20get%20more%20info%20on%20courses%20and%20placements." target='_blank'>
       <WhatsAppIcon fontSize='large' className='whatsapp'  style={whatsappStyle}/>
       </a>
       <a href="tel:+918073762257">
            <CallIcon fontSize='large' className='call'  style={callStyle}/>
       </a>
        <ArrowUpwardIcon fontSize='large' className='arrow'  style={arrowStyle} onClick={scrollToTop}/>
    </Box>
  )
}

export default FloatingIcons
