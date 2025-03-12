import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent';
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import BatchItem from './BatchItem';
import LaptopIcon from '@mui/icons-material/Laptop';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CallIcon from '@mui/icons-material/Call';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import { useAuth } from '../../../App';


 function BatchesCard({name,date,day,time,trainer,duration,mode,contact}) {
    let {openModal}=useAuth()
  return (
    <Card sx={{}} className="card">
      <Box className="course-header">
        <TypoGraphyComponent
          variant="h5"
          sx={{ mb: ".6rem" }}
          component="h5"
          text={name}
        />
      </Box>
      <CardContent className="card-content">
        <List className="links">
        <BatchItem title="Date" data={date} icon={<CalendarMonthIcon/>} />
        <BatchItem title="Day" data={day} icon={<CalendarTodayIcon/>} />
        <BatchItem title="Time" data={time}  icon={<AccessTimeIcon/>} />
        <BatchItem title="Duration" data={duration} icon={<AlarmOnIcon/>} />
        <BatchItem title="Mode" data={mode} icon={<LaptopIcon/>} />
        <BatchItem title="Trainer" data={trainer} icon={<PersonIcon/>} />
        <BatchItem title="Contact" data={contact} icon={<CallIcon/>} />


        </List>
        {/* <List className='links' sx={{listStyleType:"disc"}}>
          <TypoGraphyComponent
            variant="h6"
            sx={{}}
            component="h6"
            text={"Front End"}
        />
              {frontend.map((link,id)=>
              {
               return <ListItem  key={id} sx={{ display: 'list-item',visibility:link?"visible":"hidden"}}>
                    <ListItemText
                      primary={link}
                    />
              </ListItem>
          
              })}
               
          </List> */}
        {/* <Typography variant="body2" color="text.secondary">
    Lizards are a widespread group of squamate reptiles, with over 6,000
    species, ranging across all continents except Antarctica
  </Typography> */}
      </CardContent>
      <CardActions sx={{}} className="card-actions">
        <ButtonComponent
          size="large"
          variant="outlined"
          label="Enquire Now"
          borderRadius="0"
          sx={{}}
          onBtnClick={openModal}
        />
      </CardActions>
    </Card>
  );
}


export default BatchesCard