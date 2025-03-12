import { Box } from '@mui/material'
import React from 'react'

import { batches } from './batches'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import "./Batches.css"
import CardGrid from '../../molecules/Grid/CardGrid'
import BatchesGrid from './BatchesGrid'

function Batches() {
    let mapdataContent=["","",""]
    return (
        <Box className='batches' my={5} mx={12} id="Batches">
        <TypoGraphyComponent variant='h3' text='Upcoming Batches' component='h3' sx={{textAlign:"center",fontWeight:"bold"}} />
        <hr />
           
            <BatchesGrid xs={12} sm={12} md={6} lg={3}  mapdata={batches} />
          
    </Box>
  )
    
}

export default Batches
