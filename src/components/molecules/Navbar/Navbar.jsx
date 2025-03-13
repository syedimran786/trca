import * as React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import "../Navbar/Navbar.css"
import logo from "../../../assets/logo.jpg";
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { useAuth } from '../../../App';
import { Link, animateScroll as scroll } from 'react-scroll';
const drawerWidth = 240;
// const navItems = ['Home', 'Fish', 'Stones','Plants','Food','Lights','Air Pumps','Tanks & Bowls'];
const navItems = ['Courses', 'Mentors', 'Reviews','Clients','Placements','Batches'];


function Navbar(props) {
    let {openModal}=useAuth()
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2,fontFamily:"tilt neon" }}>
        Rest Coder Academy
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemButton sx={{ textAlign: 'center' }}>
              <ListItemText primary={<Link to={item} smooth={true} offset={-62}>{item}</Link>} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex'}}>
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          {/* <Typography
            variant="h6"
            sx={{}}
          > */}
            {/* Lake View Aquatics */}
            <img src={logo} alt=""  />
          {/* </Typography> */}
          <Box sx={{ display: { xs: 'none', sm: 'block',marginLeft:"auto" } }}>
            {navItems.map((item) => (
              <ButtonComponent key={item} sx={{ color: '#fff', }} variant='text'>
                  <Link to={item} smooth={true} offset={-62}>{item}</Link>
                  
                </ButtonComponent>
                
            ))}
             <ButtonComponent variant='contained' bgColor='bg-btn-blue' borderRadius='0px' paddingX={1.5} paddingY={.7} onBtnClick={openModal}>
                    Apply Now
                </ButtonComponent>
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
      
    </Box>
  );
}

Navbar.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

export default Navbar;