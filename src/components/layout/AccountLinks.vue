<template>
<div>
  <div class="login-sidebar__item-group login-sidebar--border-bottom">
    <div class="text2"><router-link to="/account"><b-icon class="mr-2" icon="person"></b-icon> Account</router-link></div>
    <div class="text2 mb-2"><router-link to="/wallet"><b-icon class="mr-2" icon="wallet2"></b-icon> Wallet</router-link></div>
    <div class="text2 mb-0 ml-4 d-flex justify-content-between">
      <span class="ml-2 pl-1">Balance</span>
      <div><span>STX</span> <span class="text-info text-bold">{{ balance }}</span></div>
    </div>
    <div class="text2 ml-4 d-flex justify-content-between">
      <span class="ml-2 pl-1" ref="lndQrcode" style="white-space: nowrap;">Address </span>
      <span>{{ stxAddress }} <a href="#" @click.prevent="copyAddress" class=""><b-icon icon="files"></b-icon></a></span>
    </div>
    <div class="text2 ml-4 d-flex justify-content-between">
      <span class="ml-2 pl-1 text-capitalize">Using {{walletMode}} Wallet</span>
    </div>
    <div v-if="walletMode === 'risidio'">
      <div class="text2 mb-0 ml-4 d-flex justify-content-between">
        <span class="ml-2 pl-1">Macs Balance</span>
        <div><span>STX</span> <span class="text-info">{{ balanceMac }}</span></div>
      </div>
      <div class="text2 ml-4 d-flex justify-content-between">
        <span class="ml-2 pl-1">Macs Address</span>
        <span>{{ stxAddressMac }}</span>
      </div>
      <div class="text2 mb-0 ml-4 d-flex justify-content-between">
        <span class="ml-2 pl-1">Skys Balance</span>
        <div><span>STX</span> <span class="text-info">{{ balanceSky }}</span></div>
      </div>
      <div class="text2 ml-4 d-flex justify-content-between">
        <span class="ml-2 pl-1">Skys Address</span>
        <span>{{ stxAddressSky }}</span>
      </div>
    </div>
  </div>
  <div class="login-sidebar__item-group login-sidebar--border-bottom">
    <div class="text2"><router-link to="/my-assets"><b-icon class="mr-2" icon="collection" /> My Items</router-link></div>
    <div class="text2"><router-link to="/favourites"><b-icon class="mr-2" icon="heart" /> Favourites</router-link></div>
    <!-- <div class="text2"><router-link to="#"><b-icon class="mr-2" icon="gift" /> My Offers</router-link></div> -->
  </div>
  <div class="login-sidebar__item-group login-sidebar--border-bottom">
    <div class="text2 mb-2">
      <router-link to="/admin-app"><b-icon class="mr-2" icon="gear" /> Developers</router-link>
    </div>
    <div class="text-xlight mb-2 ml-4">
      <router-link class="ml-2 pl-1" to="/admin-app">Connect Application</router-link>
    </div>
    <div class="text-xlight mb-2 ml-4">
      <span class="ml-2 pl-1" v-if="myProjects.length > 0"><router-link to="/my-apps">My Applications</router-link></span>
    </div>
    <div class="text-xlight mb-2 ml-4">
      <span class="ml-2 pl-1" v-if="showSysLink"><router-link to="/my-app-settings">System Settings</router-link></span>
    </div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import utils from '@/services/utils'

export default {
  name: 'AccountLinks',
  components: {
  },
  watch: {
  },
  data () {
    return {
    }
  },
  methods: {
    copyAddress () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      utils.copyAddress(document, this.$refs.lndQrcode, profile.stxAddress)
      this.$notify({ type: 'info', title: 'Copied', text: 'STX Address to clipboard.' })
    }
  },
  computed: {
    walletMode () {
      const walletMode = this.$store.getters[APP_CONSTANTS.KEY_WALLET_MODE]
      return walletMode
    },
    balance () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      if (profile.accountInfo) return profile.accountInfo.balance
      return null
    },
    balanceMac () {
      const wallet = this.$store.getters[APP_CONSTANTS.KEY_MACS_WALLET]
      return (wallet) ? wallet.balance : 0
    },
    balanceSky () {
      const wallet = this.$store.getters[APP_CONSTANTS.KEY_SKYS_WALLET]
      return (wallet) ? wallet.balance : 0
    },
    stxAddress () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      if (!profile || !profile.stxAddress) return 'n/a'
      return profile.stxAddress.substring(0, 5) + '...' + profile.stxAddress.substring(profile.stxAddress.length - 5)
    },
    stxAddressMac () {
      const wallet = this.$store.getters[APP_CONSTANTS.KEY_MACS_WALLET]
      if (wallet && wallet.keyInfo.address) {
        return wallet.keyInfo.address.substring(0, 5) + '...' + wallet.keyInfo.address.substring(wallet.keyInfo.address.length - 5)
      }
      return 'n/a'
    },
    stxAddressSky () {
      const wallet = this.$store.getters[APP_CONSTANTS.KEY_SKYS_WALLET]
      if (wallet && wallet.keyInfo.address) {
        return wallet.keyInfo.address.substring(0, 5) + '...' + wallet.keyInfo.address.substring(wallet.keyInfo.address.length - 5)
      }
      return 'n/a'
    },
    myProjects () {
      const projects = this.$store.getters[APP_CONSTANTS.KEY_MY_PROJECTS]
      return projects
    },
    showSysLink () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return (profile) ? profile.superAdmin : false
    }

  }
}
</script>

<style lang="scss" scoped>
</style>
