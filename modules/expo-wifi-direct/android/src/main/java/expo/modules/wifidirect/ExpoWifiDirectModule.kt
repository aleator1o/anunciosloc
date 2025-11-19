package expo.modules.wifidirect

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.os.Build
import androidx.core.app.ActivityCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import org.json.JSONArray
import org.json.JSONObject

class ExpoWifiDirectModule : Module() {
  private var wifiP2pManager: WifiP2pManager? = null
  private var channel: WifiP2pManager.Channel? = null
  private var wifiManager: WifiManager? = null
  private val peers = mutableListOf<WifiP2pDevice>()
  private var isDiscovering = false

  override fun definition() = ModuleDefinition {
    Name("ExpoWifiDirect")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      wifiP2pManager = context.getSystemService(Context.WIFI_P2P_SERVICE) as? WifiP2pManager
      wifiManager = context.getSystemService(Context.WIFI_SERVICE) as? WifiManager
      channel = wifiP2pManager?.initialize(context, context.mainLooper, null)
    }

    Function("isSupported") {
      wifiP2pManager != null
    }

    AsyncFunction("isEnabled") { promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction promise.reject("NO_CONTEXT", "No context available")
      val wifiP2pManager = this.wifiP2pManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi Direct not supported")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED) {
          promise.reject("PERMISSION_DENIED", "NEARBY_WIFI_DEVICES permission required")
          return@AsyncFunction
        }
      }

      // WiFi Direct está sempre "habilitado" se o serviço está disponível
      promise.resolve(wifiP2pManager != null)
    }

    AsyncFunction("enable") { promise: Promise ->
      // WiFi Direct é habilitado automaticamente quando disponível
      promise.resolve(true)
    }

    AsyncFunction("disable") { promise: Promise ->
      // Não é possível desabilitar WiFi Direct diretamente
      promise.resolve(false)
    }

    AsyncFunction("discoverPeers") { promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction promise.reject("NO_CONTEXT", "No context available")
      val wifiP2pManager = this.wifiP2pManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi Direct not supported")
      val channel = this.channel ?: return@AsyncFunction promise.reject("NO_CHANNEL", "Channel not initialized")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED) {
          promise.reject("PERMISSION_DENIED", "NEARBY_WIFI_DEVICES permission required")
          return@AsyncFunction
        }
      }

      wifiP2pManager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
        override fun onSuccess() {
          isDiscovering = true
          promise.resolve(true)
        }

        override fun onFailure(reasonCode: Int) {
          promise.reject("DISCOVERY_FAILED", "Failed to discover peers: $reasonCode")
        }
      })
    }

    AsyncFunction("stopPeerDiscovery") { promise: Promise ->
      val wifiP2pManager = this.wifiP2pManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi Direct not supported")
      val channel = this.channel ?: return@AsyncFunction promise.reject("NO_CHANNEL", "Channel not initialized")

      wifiP2pManager.stopPeerDiscovery(channel, object : WifiP2pManager.ActionListener {
        override fun onSuccess() {
          isDiscovering = false
          promise.resolve(true)
        }

        override fun onFailure(reasonCode: Int) {
          promise.reject("STOP_FAILED", "Failed to stop discovery: $reasonCode")
        }
      })
    }

    AsyncFunction("getPeers") { promise: Promise ->
      val wifiP2pManager = this.wifiP2pManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi Direct not supported")
      val channel = this.channel ?: return@AsyncFunction promise.reject("NO_CHANNEL", "Channel not initialized")
      val context = appContext.reactContext ?: return@AsyncFunction promise.reject("NO_CONTEXT", "No context available")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED) {
          promise.reject("PERMISSION_DENIED", "NEARBY_WIFI_DEVICES permission required")
          return@AsyncFunction
        }
      }

      wifiP2pManager.requestPeers(channel) { peerList ->
        val peersArray = JSONArray()
        for (device in peerList.deviceList) {
          val peer = JSONObject().apply {
            put("deviceName", device.deviceName)
            put("deviceAddress", device.deviceAddress)
            put("isGroupOwner", device.isGroupOwner)
            put("primaryDeviceType", device.primaryDeviceType)
            put("secondaryDeviceType", device.secondaryDeviceType)
          }
          peersArray.put(peer)
        }
        promise.resolve(peersArray.toString())
      }
    }

    AsyncFunction("connect") { deviceAddress: String, config: Map<String, Any>?, promise: Promise ->
      val wifiP2pManager = this.wifiP2pManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi Direct not supported")
      val channel = this.channel ?: return@AsyncFunction promise.reject("NO_CHANNEL", "Channel not initialized")

      val p2pConfig = WifiP2pConfig().apply {
        this.deviceAddress = deviceAddress
        // Configurações opcionais
        if (config != null) {
          config["groupOwnerIntent"]?.let {
            groupOwnerIntent = (it as? Number)?.toInt() ?: 0
          }
        }
      }

      wifiP2pManager.connect(channel, p2pConfig, object : WifiP2pManager.ActionListener {
        override fun onSuccess() {
          promise.resolve(true)
        }

        override fun onFailure(reasonCode: Int) {
          promise.reject("CONNECT_FAILED", "Failed to connect: $reasonCode")
        }
      })
    }

    AsyncFunction("disconnect") { deviceAddress: String, promise: Promise ->
      val wifiP2pManager = this.wifiP2pManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi Direct not supported")
      val channel = this.channel ?: return@AsyncFunction promise.reject("NO_CHANNEL", "Channel not initialized")

      wifiP2pManager.removeGroup(channel, object : WifiP2pManager.ActionListener {
        override fun onSuccess() {
          promise.resolve(true)
        }

        override fun onFailure(reasonCode: Int) {
          promise.reject("DISCONNECT_FAILED", "Failed to disconnect: $reasonCode")
        }
      })
    }

    AsyncFunction("sendData") { deviceAddress: String, data: String, promise: Promise ->
      // Implementação de envio de dados via socket
      // Por enquanto, retornar false (requer implementação de socket)
      promise.resolve(false)
    }

    AsyncFunction("getCurrentSSID") { promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction promise.reject("NO_CONTEXT", "No context available")
      val wifiManager = this.wifiManager ?: return@AsyncFunction promise.reject("NOT_SUPPORTED", "WiFi not supported")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
          promise.reject("PERMISSION_DENIED", "ACCESS_FINE_LOCATION permission required")
          return@AsyncFunction
        }
      }

      val wifiInfo = wifiManager.connectionInfo
      val ssid = wifiInfo.ssid
      promise.resolve(if (ssid == "<unknown ssid>") null else ssid.replace("\"", ""))
    }

    Events("onPeerDiscovered", "onConnectionChanged", "onDataReceived")
  }
}

