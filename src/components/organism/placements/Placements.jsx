import React from 'react'
import CardGrid from '../../molecules/Grid/CardGrid'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box } from '@mui/material'
import "./Placement.css"
import PlacementCard from './PlacementCard'

function Placement() {
    return (
        <Box className='placements' my={5} mx={12} p={2} id="Placements">
        <TypoGraphyComponent variant='h3' text='Placements' component='h3' sx={{textAlign:"center",fontWeight:"bold"}} />
        {/* <TypoGraphyComponent variant='h4' text='Our Trusted Placement' component='h4' sx={{textAlign:"center",fontWeight:"bold"}} /> */}

        <hr />
            <CardGrid>
                <PlacementCard/>
            </CardGrid>
    </Box>
    )
}

export default Placement
