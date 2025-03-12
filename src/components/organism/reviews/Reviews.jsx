import React from 'react'
import CardGrid from '../../molecules/Grid/CardGrid'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box } from '@mui/material'
import "./Reviews.css"
import ReviewsCard from './ReviewsCard'

function Reviews() {
    return (
        <Box className='reviews' my={5} mx={12} p={2} id="Reviews">
        <TypoGraphyComponent variant='h3' text='Reviews' component='h3' sx={{textAlign:"center",fontWeight:"bold"}} />
        <TypoGraphyComponent variant='h4' text='What they are saying about us' component='h4' sx={{textAlign:"center",fontWeight:"bold"}} />

        <hr />
            <CardGrid>
                <ReviewsCard/>
            </CardGrid>
    </Box>
    )
}

export default Reviews
