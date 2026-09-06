import { Box } from '@mui/material'
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CallIcon from '@mui/icons-material/Call';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import "./FloatingIcons.css"
import ScrollToHome from './ScrollToHome';
import {animateScroll as scroll } from 'react-scroll';
import { trackLead } from '../../../lib/analytics';

// The WhatsApp pre-fill needs to change per page so Uday knows what the
// prospect was looking at when they clicked. Before this map, every WhatsApp
// click landed as generic "info on courses and placements" — Uday had to
// phone-and-ask, and a ₹50k FDE prospect looked identical to a ₹35k Java
// enquiry until then. Course-slug pages are the ones worth being specific
// about; the rest fall back to the generic pre-fill.
const WHATSAPP_MESSAGE_BY_PATH = {
  '/courses/forward-deployed-engineering':
    "Hi Rest Coder Academy, I'm interested in the Forward Deployed Engineering program — can we schedule a call?",
  '/courses/full-stack-java':
    "Hi Rest Coder Academy, I'd like to enquire about the Full Stack Java course.",
  '/courses/full-stack-python':
    "Hi Rest Coder Academy, I'd like to enquire about the Full Stack Python course.",
  '/courses/mern-stack':
    "Hi Rest Coder Academy, I'd like to enquire about the MERN Stack course.",
};
const WHATSAPP_MESSAGE_DEFAULT =
  "Hello! Can I get more info on courses and placements.";




function FloatingIcons() {
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const whatsappHref = `https://wa.me/918073762257?text=${encodeURIComponent(
      WHATSAPP_MESSAGE_BY_PATH[location.pathname] || WHATSAPP_MESSAGE_DEFAULT
    )}`;

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
    // color: isScrolled ? 'var(--rca-navy)' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };
  const callStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    // color: isScrolled ? 'var(--rca-navy)' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };

  const arrowStyle = {
    backgroundColor: isScrolled ? 'white' : 'none',
    display:isScrolled?"block":"none",
    color: isScrolled ? 'var(--rca-navy)' : 'white',
    transition: 'background-color 0.3s ease', // Smooth transition
  };

  let scrollToTop=()=>
    {
      scroll.scrollToTop()
    }

  return (
    <Box className="floating-icons">
       <a href={whatsappHref} target='_blank' rel='noopener noreferrer' onClick={() => trackLead("whatsapp_float")}>
       <WhatsAppIcon fontSize='large' className='whatsapp'  style={whatsappStyle}/>
       </a>
       <a href="tel:+918073762257" onClick={() => trackLead("call_float")}>
            <CallIcon fontSize='large' className='call'  style={callStyle}/>
       </a>
        <ArrowUpwardIcon fontSize='large' className='arrow'  style={arrowStyle} onClick={scrollToTop}/>
    </Box>
  )
}

export default FloatingIcons
