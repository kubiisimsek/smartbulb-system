import React, { Component } from 'react'
import { 
        StyleSheet,
        Text, 
        View ,
        TextInput,
        Dimensions ,
        ActivityIndicator ,
        TouchableOpacity,
        PermissionsAndroid,
        NativeModules,
        ToastAndroid,
        AsyncStorage,
        SafeAreaView,
        FlatList } from 'react-native'


var GLOBAL = require('../global');
var WifiManager = NativeModules.WifiManagerModule;
export default class Configure extends Component {
    constructor(props){
        super(props)
        this.socket = null;
    }
    
    state={
        activityState:true,
        currentWifiSSID:"",
        wifiList:{},
        selectedWifi:"",
        wifiPassword:"",
        buttonInputState:false
    }
    componentDidMount(){
        this.requestLocationPermission();
        console.log(this.state.currentWifiSSID);
        
        this.socketEvents();

    }
    socketEvents = () => {
        this.socket = new WebSocket('ws://192.168.4.1:81');
        this.socket.onopen = () =>{
            this.setState({activityState:false})
        }
        this.socket.onerror = (msg) => {
            setTimeout(() => {
                this.socketEvents(); 
            }, 3000);
            
        }
        this.socket.onclose = () => {
            this.setState({activityState:true});
        }
    }

    async requestLocationPermission() {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              'title': 'Location Permission',
              'message': 'This app needs access to your location',
            }
          )
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                WifiManager.getCurrentWifiSSID().then(ssid => {
                    this.setState({currentWifiSSID:ssid});
                    if(ssid == "SmartBulb"){
                        WifiManager.loadWifiList(list => {
                            var wList=JSON.parse(list)
                            this.setState({wifiList:wList})
                             
                         },err => {
                             console.log(err)
                         }
                        );
                        this.setState({activityState:false});
                    }

                })        
          } else {
            console.log("Location permission denied")
          }
        } catch (err) {
          console.warn(err)
        }
      }
      _setStorage = async (ssid) => {
        try{
            await AsyncStorage.setItem('SSID',ssid);
        }
        catch(err){
            console.log('An error occured');
        }
      }
      connectButtonHandler = () => {
        AsyncStorage.clear();
        this.socket.send("SSID"+this.state.selectedWifi);
        this.socket.send("PW"+this.state.wifiPassword);
        this.socket.send("OK");
        GLOBAL.isConfigureOK=true;
        console.log("Send the wifi info");
        this._setStorage(this.state.selectedWifi);
        ToastAndroid.show('Please wait for configuration', ToastAndroid.SHORT);
        WifiManager.connectToProtectedSSID(this.state.selectedWifi,this.state.wifiPassword).then(
            (msg) => {
                if(msg){
                    setTimeout(() => {
                        this.props.navigation.navigate('Bulb',{configure:"ok"});
                        ToastAndroid.show('Configuration is completed', ToastAndroid.SHORT);
                    }, 7000);
                }
                else{
                    ToastAndroid.show('An error occured when connected the network', ToastAndroid.LONG);
                }
            },
        )

      }

      resetButtonHandler = () => {
        GLOBAL.isConfigureOK=false;
        AsyncStorage.clear();
        setTimeout(() => {
            this.props.navigation.navigate('Bulb',{ws:"reset"})
            ToastAndroid.show('Smart bulb is resetting', ToastAndroid.SHORT);
        }, 500);
        
      }
      
    render() {
        return (

                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}> CONFIGURE THE SMART BULB</Text>
                        <Text style={styles.infoText}>1.Search WiFi networks and find the smart bulb and connect it.</Text>
                        <Text style={styles.infoText}>2.You will automatically contact the bulb when connected.</Text>
                        <Text style={styles.infoText}>3.Then enter the password by selecting the network from</Text>
                        <Text style={styles.infoText}>which you want to connect the bulb from the network list. </Text>
                        <Text style={styles.infoText}>4.Finally you can connect to your own internet and use it. </Text>
                    </View>
                            
                    <View style={styles.center}>
                    {
                        GLOBAL.isConfigureOK ? 
                        (
                            <View style={{marginTop:50}}>
                                <Text style={{textAlign:'center'}}>You are already connected the smart bulb</Text>
                                <TouchableOpacity onPress={() => this.resetButtonHandler()} style={[styles.resetButton]}>
                                    <Text style={{color:'white'}}>Reset Network Configuration</Text>
                                </TouchableOpacity>
                            </View>
                        )
                        :
                        (
                            this.state.activityState ? 
                            (
                                <View>
                                    <ActivityIndicator size="large" color="#0000ff" />
                                    <Text style={{marginTop:10}}>Waiting to connect to the bulb network</Text>
                                </View>
                            ) 
                            :
                            (
                                <View style={styles.center}>
                                    <Text style={{textAlign:'center',color:'black',fontSize:15,fontFamily:'consolas',marginBottom:10}}>Network List</Text>
                                    <FlatList
                                            style={styles.flat}
                                            horizontal={false}
                                            showsHorizontalScrollIndicator={false}
                                            data={this.state.wifiList}
                                            keyExtractor={item => item.SSID}
                                            renderItem={({item}) =><TouchableOpacity style={{padding:10}} onPress={() => this.setState({selectedWifi:item.SSID,buttonInputState:true})}><Text>{item.SSID}</Text></TouchableOpacity>}
                                    />
                                    <Text style={{color:'black',marginVertical:10}}>{this.state.selectedWifi}</Text>
                                    <TextInput disabled={this.state.buttonInputState} maxLength={64}  placeholder={"Enter the password"} style={styles.inputStyle}
                                                    onChangeText={wifiPassword => this.setState({wifiPassword})}
                                                     value={this.state.wifiPassword}
                                    />
                                    <TouchableOpacity onPress={() => this.connectButtonHandler()} disabled={this.state.buttonInputState ? false:true} style={[this.state.buttonInputState ? {backgroundColor:'#37A2FF'} :{backgroundColor:'#f1f1f1'} ,styles.connectButton]}>
                                        <Text style={{color:'white'}}>Connect</Text>
                                    </TouchableOpacity>
                                    </View>
                            )
                        )

                    }
                    </View>
                        <View style={styles.bottom}>

                        </View>
                </SafeAreaView>
        )
    }
}




const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    header:{
        flex:1,
        marginTop:15,
        justifyContent:'flex-start',
        alignItems:'center'
    },
    headerText:{
        fontSize:19,
        fontFamily:'consolas',
        color:'rgb(50,50,50)'
    },
    infoText:{
        fontSize:12,
        marginTop:8
    },
    center:{
        flex:2,
        justifyContent:'space-between',
        alignItems:'center',
        marginHorizontal:10,
        marginTop:15,
    },
    flat:{
        maxHeight:'70%',
        borderWidth:1,
        borderColor:'#f1f1f1'
    },
    inputStyle:{
        justifyContent:'flex-start',
        height: 40,
        width:'100%',
        borderColor: '#f1f1f1', 
        borderWidth: 1,
        fontSize:13,
        width:Math.round(Dimensions.get('window').width / 2),
    },
    connectButton:{
        marginTop:15,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'#37A2FF',
        borderColor:'#f1f1f1',
        borderWidth:1,
        padding:5,
        width:Math.round(Dimensions.get('window').width / 2),
    },
    bottom:{
        flex:1,
        justifyContent:'flex-end',
        alignItems:'center',
    },
    resetButton:{
        justifyContent:'center',
        alignItems:'center',
        height:50,
        borderWidth:1,
        borderColor:'#f1f1f1',
        borderRadius:10,
        backgroundColor:'red',
        padding:10,
        marginTop:10,
        width:Math.round(Dimensions.get('window').width/1.1),

    }
})