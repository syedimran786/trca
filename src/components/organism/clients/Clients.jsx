import CardGrid from '../../molecules/Grid/CardGrid'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import { Box } from '@mui/material'
import "./Clients.css"
import ClientsCard from './ClientsCard'

/* These are companies our students were placed at — not clients of the
   academy. The heading says so plainly (#169). The section id stays
   "Clients" so existing links and bookmarks keep resolving; the navbar
   carries its own label separately. */
function Clients() {
    return (
        <Box className='clients rca-section' id="Clients">
        <TypoGraphyComponent variant='h3' text='Our students work at' component='h2' sx={{textAlign:"center",fontWeight:"bold"}} />

        <hr />
            <CardGrid>
                <ClientsCard/>
            </CardGrid>
    </Box>
    )
}

export default Clients
