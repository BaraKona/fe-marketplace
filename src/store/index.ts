/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue'
import Vuex from 'vuex'
import authStore from './authStore'
import applicationStore from './applicationStore'
import contentStore from './contentStore'
import searchStore from './searchStore'
import stacksStore from './stacksStore'
import projectStore from './projectStore'
import rates from 'risidio-rates'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    authStore,
    applicationStore,
    contentStore,
    searchStore,
    projectStore,
    stacksStore
  },
  state: {
    apiKey: null,
    paymentOptions: null,
    eventCode: 'connect-session',
    creditAttributes: {},
    windims: {
      innerHeight: 0,
      innerWidth: 0
    },
    modalMessage: 'Your requestion is being processed',
    myProfile: {
      loggedIn: false
    },
    categories: [
      {
        icon: 'easel',
        displayName: 'Digital Art',
        name: 'artwork'
      },
      {
        icon: 'card-list',
        displayName: 'Trading Cards',
        name: 'trading_cards'
      },
      {
        icon: 'file-earmark',
        displayName: 'Certificates',
        name: 'certificates'
      },
      {
        icon: 'globe',
        displayName: 'Digital Property',
        name: 'digital_property'
      },
      {
        icon: 'file-earmark-richtext',
        displayName: 'Written Word',
        name: 'written_word'
      },
      {
        icon: 'newspaper',
        displayName: 'News and Media',
        name: 'news_media'
      }
    ],
    xgeRates: null
  },
  getters: {
    getExchangeRates: state => {
      return state.xgeRates
    },
    getExchangeRate: state => amountStx => {
      if (!state.xgeRates) {
        return null
      }
      const rate = state.xgeRates.find(item => item.fiatCurrency === 'EUR')
      const priceInEuro = (1 / rate.amountStx) * amountStx
      return Math.round(priceInEuro * 100) / 100
    },
    getEventCode: state => {
      return state.eventCode
    },
    getModalMessage: state => {
      return state.modalMessage
    },
    getCategories: state => {
      return state.categories
    },
    getLoginConfiguration: () => {
      return {
        opcode: 'connect-login'
      }
    },
    getSectionHeight: state => {
      return (state.windims.innerHeight)
    },
    getSectionWidth: state => {
      return (state.windims.innerWidth)
    }
  },
  mutations: {
    setXgeRates (state, xgeRates) {
      state.xgeRates = xgeRates
    },
    setWinDims (state) {
      state.windims = {
        innerWidth: window.innerWidth, innerHeight: window.innerHeight
      }
    },
    myProfile (state, myProfile) {
      state.myProfile = myProfile
    },
    setEventCode (state, data) {
      state.eventCode = data.eventCode
    },
    setModalMessage (state, modalMessage) {
      state.modalMessage = modalMessage
    }
  },
  actions: {
    fetchRates ({ commit }) {
      return new Promise(() => {
        rates.fetchSTXRates().then((rates) => {
          commit('setXgeRates', rates)
        })
        setInterval(function () {
          rates.fetchSTXRates().then((rates) => {
            commit('setXgeRates', rates)
          })
        }, 3600000)
      })
    }
  }
})
