import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { CardMedia, List, ListItem, ListItemText } from '@mui/material';
import MentorIcons from './MentorIcons';
import { mentors } from './mentors';
import CardGridItem from '../../molecules/Grid/CardGridItem';

 function MentorsCard() {
  
  return (
   <>
   
   {mentors.map(({name,designation,image},id)=>
{
  
    return  <CardGridItem key={id} xs={12} sm={12} md={6} lg={4} >
             <Card sx={{ }} className='card'>
    <img
    src={image}
  />
<CardContent className='card-content'>
<MentorIcons/>

</CardContent>
<CardActions sx={{}} className='card-actions'>

<TypoGraphyComponent variant='h6' text={name} component='h6' sx={{textAlign:"center",fontWeight:"bold"}} />
<TypoGraphyComponent variant='p' text={designation} component='p' sx={{textAlign:"center",fontWeight:"bold"}} />

</CardActions>
</Card>
    </CardGridItem>
    
})}
   </>
  );
}


export default MentorsCard