import React from 'react'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box,List,ListItem,ListItemText } from '@mui/material'
import { Link, animateScroll as scroll } from 'react-scroll';


function FooterLinks() {
  let links=['Placements', 'Reviews','Batches'];

  let scrollToTop=()=>
  {
    scroll.scrollToTop()
  }
  return (
    <>
        <TypoGraphyComponent variant='h5' component='h5' text='Who Are We'/>
        <List className='links'>
        <ListItem onClick={scrollToTop}>
                
                    <ListItemText
                      primary={"About Us"}
                    />
            </ListItem>
              {links.map((link,id)=>
              {
               return <ListItem  key={id}>
                  <Link to={link} smooth={true} offset={-62}>
                    <ListItemText
                      primary={link}
                    />
                  </Link>
              </ListItem>
          
              })}
               
          </List>
    </>
  )
}

export default FooterLinks
