import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { List, ListItem, ListItemText } from '@mui/material';
import { useAuth } from '../../../App';


 function CoursesCard({name,backend,audience,frontend,syllabus}) {
    let {openModal}=useAuth()
  return (
    <Card sx={{ }} className='card'>
        <Box className="course-header">
            <TypoGraphyComponent
            variant="h5"
            sx={{mb:".6rem"}}
            component="h5"
            text={name}
        />
         <TypoGraphyComponent
            variant="text"
            sx={{}}
            component="p"
            text={audience}
        />
        </Box>
    <CardContent className='card-content'>
    <List className='links' sx={{listStyleType:"disc"}}>
    <TypoGraphyComponent
            variant="h6"
            sx={{}}
            component="h6"
            text={backend?"Backend":""}
        />
              {backend && backend.map((link,id)=>
              {
               return <ListItem  key={id} sx={{ display: link?'list-item':"none" }}>
                    <ListItemText
                      primary={link}
                    />
              </ListItem>
          
              })}
               
          </List>
          <List className='links' sx={{listStyleType:"disc"}}>
          <TypoGraphyComponent
            variant="h6"
            sx={{}}
            component="h6"
            text={frontend?"Front End":"Syllabus"}
        />
              {frontend && frontend.map((link,id)=>
              {
               return <ListItem  key={id} sx={{ display: 'list-item',visibility:link?"visible":"hidden"}}>
                    <ListItemText
                      primary={link}
                    />
              </ListItem>
          
          
              })}
{/* Syllabud  */}
        {syllabus && syllabus.map((link,id)=>
              {
               return <ListItem  key={id} sx={{ display: 'list-item',visibility:link?"visible":"hidden"}}>
                    <ListItemText
                      primary={link}
                    />
              </ListItem>
          
          
              })}
               
               
          </List>
  {/* <Typography variant="body2" color="text.secondary">
    Lizards are a widespread group of squamate reptiles, with over 6,000
    species, ranging across all continents except Antarctica
  </Typography> */}
</CardContent>
<CardActions sx={{}} className='card-actions'>
  
  <ButtonComponent size='large' variant='outlined' label='Enquire Now'  borderRadius='0' sx={{}} onBtnClick={openModal}/>
</CardActions>
</Card>
  );
}


export default CoursesCard