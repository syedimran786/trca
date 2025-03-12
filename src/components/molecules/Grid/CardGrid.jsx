import { Grid } from '@mui/material'
import React, { Fragment } from 'react'
import CoursesCard from '../../organism/courses/CoursesCard';
import MentorsCard from '../../organism/mentors/MentorsCard';

function CardGrid({xs=12,sm=6,md=6,lg=3, spacing=1,children="",mapdata=[],bgcolor="white",rowSpacing=1,columnSpacing=1}) {
   
  return (
    <Grid  container spacing={spacing} bgcolor={bgcolor} rowSpacing={rowSpacing} columnSpacing={columnSpacing}>
       {children}
    </Grid>
  )
}

export default CardGrid
