import React, { Component } from 'react'
import { 
    Dimensions,
    Text, 
    StyleSheet, 
    View , 
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    NativeModules,
    ToastAndroid,
    AsyncStorage,
    ScrollView
} from 'react-native'

import { Slider } from 'react-native-elements';



var SpotifyModule = NativeModules.SpotifyModule;
var WifiManager = NativeModules.WifiManagerModule;
var GLOBAL = require('../global');

console.disableYellowBox=true;

export default class Home extends Component {
    constructor(props){
        super(props)
        this.ws=null;
    }
        
    state={
        activityState:true,
        isStorageFull:false,
        storageSSID:"",
        bulbState:true,
        bulbText:"Close",
        infoText:null,
        imageURL:require('../assets/bulb-open.png'),
        infoText:"",
        Rvalue:0,
        Gvalue:0,
        Bvalue:0,
        animations:[
            {"id":"1","name":"Breath","color":"#fab6b1","send":"breathAnimation"},
            {"id":"2","name":"Flow","color":"#436ca3","send":"flowAnimation"},
            {"id":"3","name":"Pulse","color":"#cc0808","send":"pulseAnimation"},
            {"id":"4","name":"Party","color":"#bcc3ff","send":"partyAnimation"},
        ],
        moods:[
            {"id":"1","name":"Melancholy Instrumentals","image":require('../assets/moods/melancholy.png'),"uri":"spotify:playlist:37i9dQZF1DWZrc3lwvImLj","send":"melancholyMood"},
            {"id":"2","name":"Rainy Day","image":require('../assets/moods/rainy.png'),"uri":"spotify:playlist:37i9dQZF1DXbvABJXBIyiY","send":"rainyMood"},
            {"id":"3","name":"Feelin' Good","image":require('../assets/moods/feelin.png'),"uri":"spotify:playlist:37i9dQZF1DX9XIFQuFvzM4","send":"feelinMood"},
            {"id":"4","name":"Heart Beats","image":require('../assets/moods/heart.png'),"uri":"spotify:playlist:37i9dQZF1DWSRc3WJklgBs","send":"heartMood"},
            {"id":"5","name":"Sad Beats","image":require('../assets/moods/sad.png'),"uri":"spotify:playlist:37i9dQZF1DWVrtsSlLKzro","send":"sadMood"},
            {"id":"6","name":"Happy Beats","image":require('../assets/moods/happy.png'),"uri":"spotify:playlist:37i9dQZF1DWSf2RDTDayIx","send":"happyMood"},
            {"id":"7","name":"Positive Vibes","image":require('../assets/moods/positive.png'),"uri":"spotify:playlist:37i9dQZF1DWUAZoWydCivZ","send":"positiveMood"},
            {"id":"8","name":"Afternoon Acoustic","image":require('../assets/moods/afternoon.png'),"uri":"spotify:playlist:37i9dQZF1DX4E3UdUs7fUx","send":"afternoonMood"},
            {"id":"9","name":"Confidence Boost","image":require('../assets/moods/confidence.png'),"uri":"spotify:playlist:37i9dQZF1DX4fpCWaHOned","send":"confidenceMood"},
            {"id":"10","name":"Alone Again","image":require('../assets/moods/alone.png'),"uri":"spotify:playlist:37i9dQZF1DWX83CujKHHOn","send":"aloneMood"},
            {"id":"11","name":"Music for a Workday","image":require('../assets/moods/workday.png'),"uri":"spotify:playlist:37i9dQZF1DXcsT4WKI8W8r","send":"workMood"},
        ],
        localDevicesList:[]
    }

    // COMPONENTDIDUPDATE
    // If reset command is received from configure page,send the RESET command to smart bulb
    componentDidUpdate(){
        const { params } = this.props.navigation.state;
        if( params != undefined){
            if(params.ws === "reset"){
                this.ws.send('reset');
            }
            if(params.configure === "ok"){
                this._getDataStorage();
            }                     
        }

    }

    // COMPONENTDIDMOUNT
    componentDidMount(){
        this._getDataStorage();
    }

    /*
        In this section,it do configuration check.

        How do check configuration ?
        If the user has connected the device to a WiFi network, the WiFi information is stored in the storage.

        If SSID is saved,application is ready to scanning network and connect smart bulb.
    */
    _getDataStorage = async () => {
        try {
            const value = await AsyncStorage.getItem('SSID');
            if(value !== null){
                this.setState({isStorageFull:true,storageSSID:value});
                WifiManager.getCurrentWifiSSID().then((ssid) => {
                    if(ssid == this.state.storageSSID){
                        setTimeout(() => {
                            this.networkDevice();
                        }, 500);
                    }
                    else if(ssid == "SmartBulb"){
                        this.setState({isStorageFull:false})
                    }
                    else{
                        setTimeout(() => {
                            this._getDataStorage();
                        }, 2000);
                    }
                })

            }
            else {
                this.setState({isStorageFull:false,storageSSID:""});
            }
        }
        catch(err){
            console.log("An error occured")
        }
    }

    /*
        In this section,Mobile device try the connect smart bulb.
        Device scanning network to find devices via WifiManager (Native Modules -> In android/app/src/main/java/com/bitirmeDeneme)
        If the smart bulb is found,websocket connection is successful.
        Else again scan network and try connect the smart bulb.
    */
    networkDevice= () =>{
        WifiManager.scanNetworkDevices().then(
            msg => {
                if(msg != null){
                    this.setState({localDevicesList:msg});
                    this.socketEvents(0);
                }
            }
        )
    }

    socketEvents = (iterator) => {
        let ip = this.state.localDevicesList[iterator];
        console.log(ip);
        console.log(iterator)
        ip+=':81'
        this.ws = new WebSocket('ws://'+ip);
        this.ws.onopen = () => {
            this.setState({activityState:false});
            GLOBAL.isConfigureOK=true;
        }
        this.ws.onerror = (e) => {
            setTimeout(() => {
                if(iterator == this.state.localDevicesList.length - 1 ){
                    iterator=0
                    this.networkDevice();
                }
                else{
                    iterator+=1;
                    this.socketEvents(iterator);
                    GLOBAL.isConfigureOK=false;
                }
            }, 200);

        };
        this.ws.onclose = (e) => {
            this.setState({activityState:true});
        }
    }
    // --------------------------------------------------------------------------------------

    // If animation button is pressed
    animationPressHandler = (item) => {
        this.ws.send('stop');
        this.ws.send(''+item.send)
        this.setState({infoText:"Animation '"+item.name+"' started"})
    }
    // If mood button is pressed
    // If user dont login the spotify,navigate the spotify page.
    moodsPressHandler = (item) => {
        if(GLOBAL.spotifyLogin){
            SpotifyModule.playSong(
                item.uri,
                (msg) => {
                    this.setState({infoText:"Playing '"+item.name+"' playlist"});
                    this.ws.send('stop');
                    this.ws.send(''+item.send);
                },
                (err) => {
                    this.setState({infoText:"An error occured when play playlist"})
                }
            )
        }
        else{
            ToastAndroid.show('Please login Spotify', ToastAndroid.LONG);
            const {navigate} = this.props.navigation;
            navigate('Spotify')
        }
    }

    render() {
        dynamicButtonStyle = () => {
            color ="";
            this.state.bulbState ? color="#b0e0a8"  : color="#f76262";
            return {
                backgroundColor:color
            }
        }
        // The user cannot access the page if it cannot be connected after the operations in ComponentDidMount
        dynamicActivity = () => {
            const {navigate} = this.props.navigation;
            return (
                <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                {
                    this.state.isStorageFull ? 
                    (
                    <>                 
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text style={{textAlign:'center'}}>Searching network to connecting bulb</Text>
                        <Text style={{textAlign:'center',marginTop:20}}> This may take some time </Text>
                    </> 
                    )
                    :
                    (
                        <>
                        <Text style={{textAlign:'center'}}> Click to configure the bulb </Text>
                        <TouchableOpacity style={styles.configureButton} onPress={() => navigate('Configure') }><Text style={{color:'white'}}>Configuration</Text></TouchableOpacity>
                        </>
                    )
                }

                </View>            
            )
        }

        return ( 
            this.state.activityState ? dynamicActivity() : 
            (
            <ScrollView style={styles.mainContainer}>
                <View style={styles.row1} >
                    <Text style={styles.headerText}>Custom</Text>
                    <TouchableOpacity onPress={this.state.bulbState ? this.ws.send('open') : this.ws.send('close')} onPress={() => {
                        this.state.bulbState ? this.setState({bulbState:false,bulbText:"Open",imageURL:require('../assets/bulb-close.png')}) : this.setState({bulbState:true,bulbText:"Close",imageURL:require('../assets/bulb-open.png')})}} 
                        style={[styles.bulbButton,dynamicButtonStyle()]}
                        >
                        <Image source={this.state.imageURL} resizeMode={'stretch'} style={[{width:50,height:50}]} />
                        <Text style={styles.bulbText}>{this.state.bulbText} the bulb</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.row2}>
                        <View style={{flex:2,alignItems:'center'}}>
                            <Text>Red:{this.state.Rvalue}</Text>
                            <Slider thumbTintColor={'red'} step={1} value={this.state.Rvalue} onSlidingComplete={Rvalue => this.ws.send('SR'+Rvalue)} onValueChange={Rvalue => this.setState({Rvalue})} minimumValue={0} maximumValue={255} style={{width:'95%'}}  />
                        </View>
                        <View style={{flex:2,alignItems:'center'}}>
                            <Text>Green:{this.state.Gvalue}</Text>
                            <Slider thumbTintColor={'green'} step={1}  value={this.state.Gvalue} onSlidingComplete={Gvalue => this.ws.send('SG'+Gvalue)} onValueChange={Gvalue => this.setState({Gvalue})} minimumValue={0} maximumValue={255} style={{width:'95%'}}  />
                        </View>
                        <View style={{flex:2,alignItems:'center'}}>
                            <Text>Blue:{this.state.Bvalue}</Text>
                            <Slider thumbTintColor={'blue'} step={1}  value={this.state.Bvalue} onSlidingComplete={Bvalue => this.ws.send('SB'+Bvalue)} onValueChange={Bvalue => this.setState({Bvalue})} minimumValue={0} maximumValue={255} style={{width:'95%'}}  />
                        </View>
                        <View style={{flex:2,alignItems:'center'}}>
                            <Text style={{fontSize:12}}>RGB({this.state.Rvalue},{this.state.Gvalue},{this.state.Bvalue})</Text>
                            <View style={{marginVertical:10,width:25,height:25,backgroundColor:'rgb('+this.state.Rvalue+','+this.state.Gvalue+','+this.state.Bvalue+')'}}></View>
                        </View>
                </View>
                <View style={styles.row3}>
                    <Text style={styles.headerText}>Animations</Text>
                    <FlatList 
                        showsHorizontalScrollIndicator={false}
                        data={this.state.animations}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => <TouchableOpacity onPress={() => this.animationPressHandler(item)} style={[styles.animationButtons,{backgroundColor:item.color}]}><Text style={{textAlign:'center',color:'black'}}>{item.name}</Text></TouchableOpacity> }
                        horizontal={true}
                    />

                </View>
                <View style={styles.row4}>
                    <Text style={styles.headerText}>Moods</Text>
                    <FlatList 
                        showsHorizontalScrollIndicator={false}
                        data={this.state.moods}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => <TouchableOpacity onPress={() => this.moodsPressHandler(item)} style={{flex:1,width:150,height:150,marginVertical:5,marginRight:10,justifyContent:'center',alignItems:'center'}}><Image source={item.image} style={{height:128,width:128,justifyContent:'center'}} /><Text style={{textAlign:'center',color:'black',marginTop:5,fontSize:10}}>{item.name}</Text></TouchableOpacity>}
                        horizontal={true}
                    />
                </View>
                <View style={styles.row5}>
                    <View style={{backgroundColor:'#f1f1f1',marginTop:15}}>
                        <Text style={{textAlign:'center',color:'black',fontSize:14}}>{this.state.infoText}</Text>
                    </View>
                </View>
            </ScrollView>
            )
        )
    }
}



const styles = StyleSheet.create({
    mainContainer:{
        flex:1,
        padding:5,
 
    },
    headerText:{
        textAlign:"center",
        fontSize:15,
        backgroundColor:'#f1f1f1'
    },
    row1:{
        flex:6,
    },
    bulbButton:{
        justifyContent:'center',
        alignItems:'center',
        width:'100%',
        height:80,
        marginVertical:10
        
    },
    bulbText:{
        color:'black'
    },
    row2:{
        flex:4,
        flexDirection:'row',
        marginTop:15,
    },
    row3:{
        flex:6
    },
    animationButtons:{
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        width:100,
        height:100,
        marginVertical:5,
        marginRight:10,
    },
    row4:{
        flex:8
    },
    row5:{
        flex:2
    },
    configureButton:{
        marginTop:15,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'#37A2FF',
        borderColor:'#f1f1f1',
        borderWidth:1,
        padding:5,
        width:'30%',
    },
})
