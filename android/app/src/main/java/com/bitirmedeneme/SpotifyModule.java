//  Created by react-native-create-bridge

package com.bitirmedeneme;

import android.support.annotation.Nullable;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.IllegalViewOperationException;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;


import java.util.HashMap;
import java.util.Map;
import java.util.List;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapFactory;
import android.util.Base64;
import java.io.ByteArrayOutputStream;

import com.spotify.android.appremote.api.ConnectionParams;
import com.spotify.android.appremote.api.Connector;
import com.spotify.android.appremote.api.SpotifyAppRemote;

import com.spotify.protocol.types.Image.Dimension;
import com.spotify.protocol.client.Subscription;
import com.spotify.protocol.client.CallResult;
import com.spotify.protocol.types.PlayerState;
import com.spotify.protocol.types.Track;
import com.spotify.protocol.types.PlaybackPosition;
import com.spotify.protocol.types.Artist;
import com.spotify.protocol.types.ImageUri;
import com.facebook.react.bridge.Promise;

public class SpotifyModule extends ReactContextBaseJavaModule {

    private static final String CLIENT_ID = "40b2a03d5ed2485280c4a0d09ff1957c";
    private static final String REDIRECT_URI = "bitirmedeneme://auth";
    private SpotifyAppRemote mSpotifyAppRemote = null;
    private String mesaj = "";
    private static ReactApplicationContext reactContext = null;
    private String  bs64 ="";


    public SpotifyModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;

    }

    @ReactMethod
    public void settings(Callback successCallback, Callback errorCallback){
        

        ConnectionParams connectionParams = new ConnectionParams.Builder(CLIENT_ID).setRedirectUri(REDIRECT_URI).showAuthView(true).build();

        SpotifyAppRemote.connect(reactContext, connectionParams,
                new Connector.ConnectionListener() {

                    @Override
                    public void onConnected(SpotifyAppRemote spotifyAppRemote) {
                        mSpotifyAppRemote = spotifyAppRemote;
                        mSpotifyAppRemote.getPlayerApi().pause();
                        successCallback.invoke(true);

                        mSpotifyAppRemote.getPlayerApi().subscribeToPlayerState().setEventCallback(new Subscription.EventCallback<PlayerState>() {
                            @Override
                            public void onEvent(PlayerState playerState) {
                                WritableMap params = Arguments.createMap();
                                WritableArray artists = Arguments.createArray();
                                
                                Long x = playerState.playbackPosition;
                                int y = x.intValue();
                                Long a = playerState.track.duration;
                                int b = a.intValue();
                                for(Artist artistList:playerState.track.artists){
                                    artists.pushString(artistList.name);
                                }
                                mSpotifyAppRemote.getImagesApi().getImage(playerState.track.imageUri).setResultCallback(new CallResult.ResultCallback<Bitmap>(){
                                    @Override 
                                    public void onResult(Bitmap image){
                                        bs64 = convertToBs64(image);
                                    }
                                });
                                
                                params.putInt("position", y);
                                params.putInt("duration",b);
                                params.putString("song_name",playerState.track.name);
                                params.putBoolean("is_paused",playerState.isPaused);
                                params.putArray("artists",artists);
                                params.putString("image",bs64);
     

                                sendEvent("playerStateEvent", params);
                            }
                        });
                    }

                    @Override
                    public void onFailure(Throwable throwable) {           
                        errorCallback.invoke(throwable.getMessage());
                    }

                      
          });

    }
    
    private void sendEvent(String eventName,@Nullable WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
    @ReactMethod 
    public void isSpotifyInstalled(Callback successCallback, Callback errorCallback){
       boolean state = mSpotifyAppRemote.isSpotifyInstalled(reactContext);
       if(state) successCallback.invoke(state);
       else errorCallback.invoke(state);
    }
    @ReactMethod 
    public void disconnect(){
        mSpotifyAppRemote.getPlayerApi().pause();
        mSpotifyAppRemote=null;
    }
    @ReactMethod 
    public void seekTo(int ms){
        mSpotifyAppRemote.getPlayerApi().seekTo(ms);
    }
    @ReactMethod 
    public void setShuffle(Boolean res){
         mSpotifyAppRemote.getPlayerApi().setShuffle(res);
    }
    @ReactMethod 
    public void setRepeatMode(int mode){
         // Repeat ALL = 2,Repeat OFF = 0,Repeat ON = 1
         mSpotifyAppRemote.getPlayerApi().setRepeat(mode);
    }
    @ReactMethod 
    public void togglePause(){
         mSpotifyAppRemote.getPlayerApi().pause();
    }
    @ReactMethod 
    public void togglePlay(){
         mSpotifyAppRemote.getPlayerApi().resume();
    }
    @ReactMethod 
    public void skipPrevious(){
         mSpotifyAppRemote.getPlayerApi().skipPrevious();
    }
    @ReactMethod 
    public void skipNext(){
         mSpotifyAppRemote.getPlayerApi().skipNext();
    }
    @ReactMethod
    public void playSong(String uri,Callback successCallback, Callback errorCallback) {
        try {
            mSpotifyAppRemote.getPlayerApi().play(uri);
            successCallback.invoke("Play:"+uri);

        } catch (IllegalViewOperationException e) {
            errorCallback.invoke("Hata");
        }
    }



    public String convertToBs64(Bitmap bitmap) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);

        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT);
      }


    @Override
    public String getName() {
        return "SpotifyModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("EXAMPLE_CONSTANT", "example");

        return constants;
    }

}