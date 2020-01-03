import React, {Component} from 'react';
import {View,Text,NativeModules} from 'react-native'
import Router from './src/Router'

var WifiManager = NativeModules.WifiManagerModule;
var SpotifyModule = NativeModules.SpotifyModule;
export default class App extends Component {
  state = {
    status:false
  }
  componentDidMount(){
    WifiManager.connectionStatus(res => {
      if(res === true) this.setState({status:res})
      else this.setState({status:res})
    })
  }
  componentWillUnmount(){
    SpotifyModule.togglePause();
  }

  render() {
    return (
      
      this.state.status ? <Router/> : (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text style={{fontFamily:'Calibri',fontSize:20,letterSpacing:2}}>Please</Text>
        <Text style={{fontFamily:'Calibri',fontSize:20,letterSpacing:2}}>Enable WiFi</Text>
      </View>
      )
      
    );
  }
}


