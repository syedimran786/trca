import React from 'react'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box,List,ListItem,ListItemText } from '@mui/material'
// import {Link} from "react-router-dom"
import { Link } from '@mui/material';

function FooterLinks() {
  let links=['About us', 'Placements', 'Reviews','Batches']
  return (
    <>
        <TypoGraphyComponent variant='h5' component='h5' text='Who Are We'/>
        <List className='links'>
              {links.map((link,id)=>
              {
               return <ListItem  key={id}>
                  <Link to="/">
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
