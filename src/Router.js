import React from 'react';
import { createBottomTabNavigator , createAppContainer } from 'react-navigation';

import Home from './pages/Home';
import SpotifyScreen from './pages/SpotifyScreen';
import Configure from './pages/Configure';
import Icon from 'react-native-vector-icons/Ionicons'

const TabNavigator=createBottomTabNavigator({
    Bulb:{
        screen:Home,
        navigationOptions:{
            tabBarIcon: ({tintColor}) => (<Icon name="md-bulb" size={22} color={tintColor} />)
        }
    },
    Spotify:{
        screen:SpotifyScreen,
        navigationOptions:{
            tabBarIcon: ({tintColor}) => (<Icon name="md-volume-high" size={22} color={tintColor} />)
        }
    },
    Configure:{
        screen:Configure,
        navigationOptions:{
            tabBarIcon: ({tintColor}) => (<Icon name="md-settings" size={22} color={tintColor} />)
        }
    },
},
{
    tabBarOptions:{
        activeTintColor:'red'
    },
    initialRouteName: 'Bulb', 
}
);


export default createAppContainer(TabNavigator)