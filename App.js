import React, {Component} from 'react';
import {View,Text,NativeModules,StyleSheet,Image,ActivityIndicator} from 'react-native'
import Router from './src/Router'

var WifiManager = NativeModules.WifiManagerModule;
var SpotifyModule = NativeModules.SpotifyModule;
export default class App extends Component {
  state = {
    status:false,
    splashState:true,
    bulbImage:require('./src/assets/bulb-close.png'),
    splashBG:'#333',
    textColor:'#fff',
  }
  componentDidMount(){
    WifiManager.connectionStatus(res => {
      if(res === true) this.setState({status:res})
      else this.setState({status:res})
    });
    setTimeout(() => {
      this.setState({splashState:false});
    }, 2000);
    setInterval(() => {
        this.state.splashBG == '#333' ? this.setState({
          splashBG:'#fff',
          bulbImage:require('./src/assets/bulb-open.png'),
          textColor:'#000'
        }) : this.setState({
          splashBG:'#333',
          bulbImage:require('./src/assets/bulb-close.png'),
          textColor:'#fff'
        })
    }, 1000);
  }
  componentWillUnmount(){
    SpotifyModule.togglePause();
  }

  render() {

    return (
      this.state.splashState ? 
      (
        <View style={[styles.container,{backgroundColor:this.state.splashBG}]}>
          <Image source={this.state.bulbImage} resizeMode={'stretch'} style={[{width:100,height:100}]} />
          <Text style={[{marginVertical:30,fontSize:20,fontStyle:'italic',color:this.state.textColor}]}>SmartBulb System</Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )
      : 
      (
        this.state.status ? <Router/> : (
        <View style={styles.container}>
          <Text style={{fontFamily:'Calibri',fontSize:20,letterSpacing:2}}>Please</Text>
          <Text style={{fontFamily:'Calibri',fontSize:20,letterSpacing:2}}>Enable WiFi</Text>
        </View>
        )
      )
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  }
})