import { Box } from '@mui/material'
import React from 'react'

import { courses } from './courses'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import "./Courses.css"
import CardGrid from '../../molecules/Grid/CardGrid'
import CoursesGrid from './CoursesGrid'

function Courses() {
    let mapdataContent=["","",""]
    return (
        <Box className='courses' my={5} mx={12} id="Courses">
        <TypoGraphyComponent variant='h3' text='Courses' component='h3' sx={{textAlign:"center",fontWeight:"bold"}} />
        <hr />
           
            <CoursesGrid xs={12} sm={12} md={6} lg={4}  mapdata={courses} />
          
    </Box>
  )
    
}

export default Courses
