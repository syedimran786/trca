import React from 'react'
import CardGrid from '../../molecules/Grid/CardGrid'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box } from '@mui/material'
import "./Mentors.css"
import { mentors } from './mentors'
import MentorsCard from './MentorsCard'

function Mentors() {
    return (
        <Box className='mentors' my={5} mx={12} id="Mentors">
        <TypoGraphyComponent variant='h3' text='Mentors' component='h3' sx={{textAlign:"center",fontWeight:"bold"}} />
        <hr />
            <CardGrid>
                <MentorsCard/>
            </CardGrid>
    </Box>
    )
}

export default Mentors
