import { Box } from '@mui/material'
import React, { useState, useEffect, useRef } from 'react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CallIcon from '@mui/icons-material/Call';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import "./FloatingIcons.css"



function FloatingIcons() {
    const [isScrolled, setIsScrolled] = useState(false);
  const threshold = 4250; // Adjust this value as needed
  const elementRef = useRef(null);
  console.log(window.scrollY)
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
    // color: isScrolled ? 'rgb(5, 5, 77)' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };
  const callStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    // color: isScrolled ? 'rgb(5, 5, 77)' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };

  const arrowStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    display:isScrolled?"block":"none",
    color: isScrolled ? 'rgb(5, 5, 77)' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };
  return (
    <Box className="floating-icons">
       <a href="https://wa.me/9731661294?Welcome to%20Rest%20Code%20Academy.You%20may%20ask%20your%20queries%20here." target='_blank'>
       <WhatsAppIcon fontSize='large' className='whatsapp'  style={whatsappStyle}/>
       </a>
        <CallIcon fontSize='large' className='call'  style={callStyle}/>
        <ArrowUpwardIcon fontSize='large' className='arrow'  style={arrowStyle}/>
    </Box>
  )
}

export default FloatingIcons
