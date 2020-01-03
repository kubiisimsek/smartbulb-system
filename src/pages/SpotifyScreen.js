import React, { Component } from 'react';
import { Text, StyleSheet, View,TouchableOpacity,Image,ToastAndroid} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import { Slider } from 'react-native-elements';
import BackgroundTimer from 'react-native-background-timer';

import {NativeEventEmitter,NativeModules} from 'react-native';

var GLOBAL = require('../global');

var SpotifyModule = NativeModules.SpotifyModule;
const _intervalId = null;

export default class SpotifyScreen extends Component {
	constructor(props){
		super(props)
		this.state={
			spotifyLogin:false,
			isSpotifyInstalled:false,
			trackInfo:{},
			playerIsPaused:null,
			playerSecondValue:0,
			playerTime:"0:00",
			songSecond:0,
			image:"",
			artists:"",
			duration:"",
			playerShuffle:false,
			playerRepeat:0,
			repeatColor:'black'
		}
	}
	// COMPONENT DID MOUNT
	componentDidMount() {
			const eventEmitter = new NativeEventEmitter(NativeModules.SpotifyModule);
			eventEmitter.addListener('playerStateEvent', async(event) => {
					if(this.state.trackInfo.song_name !== event.song_name){
						// DETECT THE SONG CHANGE IF CHANGE IT PLAYER VALUE SET 0
						this.setState({playerSecondValue:0})
					}
					this.setState({
						playerIsPaused:event.is_paused,
						trackInfo:event,
						artists:event.artists.join(" & "),
						image:event.image,
						songSecond:event.duration / 1000,
						playerSecondValue:Math.floor(event.position / 1000),
					})
					this.calculateMStoMIN();
			})

			SpotifyModule.isSpotifyInstalled(
				msg => {this.setState({isSpotifyInstalled:true})},
				err => {this.setState({isSpotifyInstalled:this.loginFalse})}
			)

			
		}

	//-------------------------------------------------------------------------------------------
	loginButton = () => {
		if(this.state.isSpotifyInstalled){
			SpotifyModule.settings((msg) => {
				ToastAndroid.show('Login is successful', ToastAndroid.SHORT);
				this.setState({spotifyLogin:msg})
				GLOBAL.spotifyLogin=msg;
			},
			(err) => {
				ToastAndroid.show('Be sure to log in to your Spotify account', ToastAndroid.LONG);
				SpotifyModule.isSpotifyInstalled(
					(msg) => {},
					(err) => {ToastAndroid.show('Please install the Spotify App.', ToastAndroid.LONG);}
				)
			}
			)
		}
		else{
			ToastAndroid.show('Please install the Spotify App.', ToastAndroid.LONG);
		}

	}

	seekToSong = (second) => {
		SpotifyModule.seekTo(second * 1000); // Convert the millisecond
	}
	setShuffle = () => {
		this.setState({playerShuffle:!this.state.playerShuffle});
		SpotifyModule.setShuffle(this.state.playerShuffle);
	}
	setRepeatMode = () => {
		if(this.state.playerRepeat == 0) this.setState({playerRepeat:1,repeatColor:'#ff8500'})
		else if(this.state.playerRepeat == 1) this.setState({playerRepeat:2,repeatColor:'#00BD5F'})
		else if(this.state.playerRepeat == 2) this.setState({playerRepeat:0,repeatColor:'black'})
		console.log(this.state.playerRepeat + this.state.repeatColor);
		//Repeat 1 = ON, Repeat 2 = ALL , Repeat 0 = OFF
		SpotifyModule.setRepeatMode(this.state.playerRepeat);
	}
	toggleSong = () => {
		if(this.state.playerIsPaused)
			SpotifyModule.togglePlay();
		else
			SpotifyModule.togglePause();	
	}
	
	skipNext = () => { SpotifyModule.skipNext(); }
	skipPrevious = () => { SpotifyModule.skipPrevious(); }


	calculateMStoMIN = () => {
			var millis = this.state.trackInfo.duration;
			var minutes = Math.floor(millis / 60000);
			var seconds = ((millis % 60000) / 1000).toFixed(0);
			this.setState({duration:minutes + ":" + (seconds < 10 ? '0' : '') + seconds});
	}

	/*
		In this section, the millisecond value from spotify for the player is converted to seconds.
		is shown continuously in the player with interval function.
	*/
	_intervalId = BackgroundTimer.setInterval(() => {
		if(this.state.playerIsPaused){
			BackgroundTimer.clearTimeout(_intervalId);
		}
		else{
			if(this.state.playerSecondValue != this.state.songSecond){
				this.setState({
					playerSecondValue:this.state.playerSecondValue + 1
				})
				var min = Math.floor(this.state.playerSecondValue / 60);
				var sec = Math.floor(this.state.playerSecondValue - min * 60);
				var plsec = (sec < 10 ? '0' : '') + sec;
				this.setState({playerTime:min+":"+plsec});
			}
			else{
				this.setState({playerSecondValue:0})
			}
		}
	}, 1000);

	// RENDER SECTION -----------------------------------------------------------------------------------
	loginFalse = () => {
		return(
			<View style={styles.container}>
				<Image style={{width:80,height:80,marginBottom:20}} source={require('../assets/spotify-logo.png')} />
				<TouchableOpacity style={styles.loginButton} onPress={() => this.loginButton()}>
					<Text style={styles.loginButtonText}>Login Spotify</Text>
				</TouchableOpacity>
				<View style={styles.requirements}>
					<Text style={{fontSize:10}}>You must go to the Spotify and login your account.</Text>
					<Text style={{fontSize:10}}>Your Spotify account must be premium.</Text>
				</View>
			</View>
		)
	}

	loginTrue = () => {
		return(
			<View style={styles.loginTrueContainer}>
				<View style={styles.playerTop}>
					<Image  style={styles.songImage} source={{uri:'data:image/png;base64,'+this.state.image}} />
				</View>
				<View>
				<View style={styles.trackInfoArea}>
						<Text style={styles.trackName}>{this.state.trackInfo.song_name}</Text>
						<Text style={styles.trackArtists}>{ this.state.artists  }</Text>
					</View>
				</View>
				<View style={styles.playerCenter}>
					<Text style={styles.playerDurationStart}>{this.state.playerTime}</Text>
					<Slider style={{width:'75%'}} thumbTintColor={'rgb(24,24,24)'} step={1} value={this.state.playerSecondValue} onSlidingComplete={(value) => this.seekToSong(value)} minimumValue={0} maximumValue={this.state.songSecond} />
					<Text style={styles.playerDurationEnd}>{this.state.duration}</Text>
				</View>
				<View style={styles.playerBot}>
					<TouchableOpacity onPress={() => this.setShuffle()} style={styles.shuffleButton}>
						<Icon name="md-shuffle" size={18} color={this.state.playerShuffle ? '#00BD5F':'rgb(24,24,24)'}/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => this.skipPrevious()} style={styles.previousButton} >
						<Icon name="md-skip-backward" size={30} color={'rgb(24, 24, 24)'}/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => this.toggleSong()} style={styles.toggleButton}>
						<Icon name={this.state.playerIsPaused ? "md-play" : "md-pause"} size={30} color={'rgb(24, 24, 24)'}/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => this.skipNext()} style={styles.nextButton}>
						<Icon name="md-skip-forward" size={30} color={'rgb(24, 24, 24)'}/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => this.setRepeatMode()} style={styles.repeatButton} >
						<Icon name="md-repeat" size={18} color={this.state.repeatColor}/>
					</TouchableOpacity>
				</View>
			</View>
		)
	}
	
    render() {
        return (
			<View style={{flex:1}}>

					{
						this.state.spotifyLogin ? 
						(
							this.loginTrue()
						) : 
						(
							this.loginFalse()
						)
					}
			</View>
        )
	}
}



const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loginButton:{
		backgroundColor:'rgb(24, 24, 24)',
		width:150,
		height:35,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius:40
	},
	loginButtonText:{
		color:'rgb(29, 185, 84)',
		fontWeight:'bold'
		
	},
	requirements:{
		justifyContent: 'center',
		alignItems: 'center',
		marginTop:15,
	},
	loginTrueContainer:{
		flex:1,
	},
	playerTop:{
		flex:3,

	},
	songImage:{
		flex:1,
		marginTop:20,
		marginHorizontal:20,
		borderWidth:1,
		borderColor:'white',
	},
	playerCenter:{
		flex:0.5,
		flexDirection:'row',
		justifyContent:'space-around',
		alignItems:'center'
	},
	playerBot:{
		flex:1,
		flexDirection:'row',
		justifyContent:'center',
	},
	previousButton:{
		marginHorizontal:10,
		justifyContent:'center',
		alignItems:'center',
		width:70,
		height:70,
		borderRadius:35,
		borderWidth:1,
		borderColor:'transparent'
	},
	nextButton:{
		marginHorizontal:10,
		justifyContent:'center',
		alignItems:'center',
		width:70,
		height:70,
		borderRadius:35,
		borderWidth:1,
		borderColor:'transparent'
	},
	toggleButton:{
		marginHorizontal:10,
		justifyContent:'center',
		alignItems:'center',
		width:70,
		height:70,
		borderRadius:35,
		borderWidth:1,
		borderColor:'black',
	},
	shuffleButton:{
		justifyContent:'center',
		alignItems:'center',
		width:70,
		height:70,
	},
	repeatButton:{
		justifyContent:'center',
		alignItems:'center',
		width:70,
		height:70,
	},
	trackInfoArea:{
		flex:0.1,
		justifyContent:'center',
		alignItems:'center',
		marginVertical:30
	},
	trackName:{
		fontSize:17,
		color:'rgb(24,24,24)'
	},
	trackArtists:{
		fontSize:13,
		color:'rgb(50,50,50)'
	}



});