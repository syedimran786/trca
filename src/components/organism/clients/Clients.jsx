import React from 'react'
import CardGrid from '../../molecules/Grid/CardGrid'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box } from '@mui/material'
import "./Clients.css"
import ClientsCard from './ClientsCard'

function Clients() {
    return (
        <Box className='clients' my={5} mx={12} p={2} id="Clients">
        <TypoGraphyComponent variant='h3' text='Clients' component='h3' sx={{textAlign:"center",fontWeight:"bold"}} />
        <TypoGraphyComponent variant='h4' text='Our Trusted Clients' component='h4' sx={{textAlign:"center",fontWeight:"bold"}} />

        <hr />
            <CardGrid>
                <ClientsCard/>
            </CardGrid>
    </Box>
    )
}

export default Clients
