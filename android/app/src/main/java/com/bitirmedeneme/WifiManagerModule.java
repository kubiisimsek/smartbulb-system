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
import com.facebook.react.bridge.Promise;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

import com.facebook.react.bridge.WritableArray;

import android.provider.Settings;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiConfiguration;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.net.NetworkCapabilities;
import android.net.Network;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.DhcpInfo;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.os.Build;
import android.os.Bundle;

import java.util.List;
import java.io.IOException;
import java.lang.Thread;
import java.net.InetAddress;
import java.net.UnknownHostException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


public class WifiManagerModule extends ReactContextBaseJavaModule {

    WifiManager wifi;
    ReactApplicationContext reactContext;

    public WifiManagerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
		wifi = (WifiManager)reactContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
	}



    @ReactMethod
	public void loadWifiList(Callback successCallback, Callback errorCallback) {
		try {
			List < ScanResult > results = wifi.getScanResults();
			JSONArray wifiArray = new JSONArray();

			for (ScanResult result: results) {
				JSONObject wifiObject = new JSONObject();
				if(!result.SSID.equals("")){
					try {
						wifiObject.put("SSID", result.SSID);
						//wifiObject.put("BSSID", result.BSSID);
						//wifiObject.put("capabilities", result.capabilities);
						//wifiObject.put("frequency", result.frequency);
						//wifiObject.put("level", result.level);
						//wifiObject.put("timestamp", result.timestamp);

					} 
					catch (JSONException e) {
          	            errorCallback.invoke(e.getMessage());
					}
					wifiArray.put(wifiObject);
				}
			}
			successCallback.invoke(wifiArray.toString());
		} catch (IllegalViewOperationException e) {
			errorCallback.invoke(e.getMessage());
		}
	}

	@ReactMethod
	public void scanNetworkDevices(Promise promise){
		DhcpInfo d = wifi.getDhcpInfo();
		InetAddress host;
		try{
			WritableArray ipList = Arguments.createArray();
			host = InetAddress.getByName(intToIp(d.dns1));
			byte[] ip = host.getAddress();
			
			for(int i = 1;i<=254;i++){
				ip[3] = (byte) i;
                InetAddress address = InetAddress.getByAddress(ip);
                if(address.isReachable(30))
                {
					ipList.pushString(address.toString());	
                }
			}
			promise.resolve(ipList);
		}
		catch(IOException e){
			promise.resolve(null);
		}

	}
	public String intToIp(int i) {
        return (i & 0xFF) + "." +
                ((i >> 8 ) & 0xFF) + "." +
                ((i >> 16) & 0xFF) + "." +
                ((i >> 24) & 0xFF);
    }

	@ReactMethod
	public void connectionStatus(Callback connectionStatusResult) {
		ConnectivityManager connManager = (ConnectivityManager) getReactApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE);
		NetworkInfo mWifi = connManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
		if (mWifi.isConnected()) {
			connectionStatusResult.invoke(true);
		} else {
			connectionStatusResult.invoke(false);
		}
	}
	@ReactMethod
	public void getCurrentWifiSSID(final Promise promise) {
		WifiInfo info = wifi.getConnectionInfo();

		// This value should be wrapped in double quotes, so we need to unwrap it.
		String ssid = info.getSSID();
		if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
			ssid = ssid.substring(1, ssid.length() - 1);
		}

		promise.resolve(ssid);
	}



	@ReactMethod
	public void connectToProtectedSSID(String ssid, String password, Promise promise) {
		List < ScanResult > results = wifi.getScanResults();
		boolean connected = false;
		for (ScanResult result: results) {
			String resultString = "" + result.SSID;
			if (ssid.equals(resultString)) {
				connected = connectTo(result, password, ssid);
			}
		}
		if (connected) {
			promise.resolve(true);
		} else {
			promise.resolve(false);
		}
	}


	//Method to connect to WIFI Network
	public Boolean connectTo(ScanResult result, String password, String ssid) {
		//Make new configuration
		WifiConfiguration conf = new WifiConfiguration();
		
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        conf.SSID = ssid;
    } else {
        conf.SSID = "\"" + ssid + "\"";
    }

		String capabilities = result.capabilities;
		
		if (capabilities.contains("WPA")  || 
          capabilities.contains("WPA2") || 
          capabilities.contains("WPA/WPA2 PSK")) {

	    // appropriate ciper is need to set according to security type used,
	    // ifcase of not added it will not be able to connect
	    conf.preSharedKey = "\"" + password + "\"";
	    
	    conf.allowedProtocols.set(WifiConfiguration.Protocol.RSN);
	    
	    conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK);
	    
	    conf.status = WifiConfiguration.Status.ENABLED;
	    
	    conf.allowedGroupCiphers.set(WifiConfiguration.GroupCipher.TKIP);
	    conf.allowedGroupCiphers.set(WifiConfiguration.GroupCipher.CCMP);
	    
	    conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK);
	    
	    conf.allowedPairwiseCiphers.set(WifiConfiguration.PairwiseCipher.TKIP);
	    conf.allowedPairwiseCiphers.set(WifiConfiguration.PairwiseCipher.CCMP);
	    
	    conf.allowedProtocols.set(WifiConfiguration.Protocol.RSN);
	    conf.allowedProtocols.set(WifiConfiguration.Protocol.WPA);

		}	else if (capabilities.contains("WEP")) {
			conf.wepKeys[0] = "\"" + password + "\"";
			conf.wepTxKeyIndex = 0;
			conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE);
			conf.allowedGroupCiphers.set(WifiConfiguration.GroupCipher.WEP40);

		} else {
			conf.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE);
		}

		//Remove the existing configuration for this netwrok
		List<WifiConfiguration> mWifiConfigList = wifi.getConfiguredNetworks();

		int updateNetwork = -1;

		for(WifiConfiguration wifiConfig : mWifiConfigList){
			if(wifiConfig.SSID.equals(conf.SSID)){
				conf.networkId = wifiConfig.networkId;
				updateNetwork = wifi.updateNetwork(conf);
			}
		}

    // If network not already in configured networks add new network
		if ( updateNetwork == -1 ) {
      updateNetwork = wifi.addNetwork(conf);
      wifi.saveConfiguration();
		};

    if ( updateNetwork == -1 ) {
      return false;
    }

    boolean disconnect = wifi.disconnect();
		if ( !disconnect ) {
			return false;
		};

		boolean enableNetwork = wifi.enableNetwork(updateNetwork, true);
		if ( !enableNetwork ) {
			return false;
		};

		return true;
	}
		
	
    @Override
    public String getName() {
        return "WifiManagerModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("EXAMPLE_CONSTANT", "example");

        return constants;
    }

}

