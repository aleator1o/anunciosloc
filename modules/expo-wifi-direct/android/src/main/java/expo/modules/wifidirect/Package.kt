package expo.modules.wifidirect

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.Package

class ExpoWifiDirectPackage : Package {
  override fun definition() = listOf<Module>(
    ExpoWifiDirectModule()
  )
}

