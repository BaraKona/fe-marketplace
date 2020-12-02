import projectService from '@/services/projectService.js'
import store from '.'
import { uintCV, intCV, serializeCV } from '@stacks/transactions'
import searchIndexService from '@/services/searchIndexService'

const KEY_GAIA_PROJECT = 'getGaiaProject'
const mac = JSON.parse(process.env.VUE_APP_WALLET_MAC || '')

const applicationStore = {
  namespaced: true,
  state: {
    rootFile: null,
    appmap: {
      apps: []
    },
    gaiaProjects: [],
    appCounter: -1,
    appmapContractId: mac.keyInfo.address + '.appmap'
  },
  getters: {
    getAppmapTxId: (state: any) => {
      return state.appmap.txId
    },
    getClarityAsset: (state: any) => (assetHash: string) => {
      state.appmap.apps.forEach(function (application) {
        if (application.clarityAssets) {
          const index = application.clarityAssets.findIndex((o) => o.assethash === assetHash)
          if (index > -1) {
            return application.clarityAssets[index]
          }
        }
      })
      return null
    },
    getClarityAssets: (state: any) => (appCounter: string) => {
      const index = state.appmap.apps.findIndex((o) => o.appCounter === appCounter)
      if (index > -1) {
        return state.appmap.apps[index].clarityAssets
      }
      return null
    },
    getAppmapTradeInfo: (state: any) => (data: any) => {
      const index = state.appmap.apps.findIndex((o) => o.appCounter === data.appCounter)
      if (index > -1) {
        const assets = state.appmap.apps[index].clarityAssets
        const index1 = assets.findIndex((o) => o.assetHash === data.assetHash)
        if (index1 > -1) {
          return assets[index1].tradeInfo
        }
      }
      return null
    },
    getAppmap: state => {
      return state.appmap
    },
    getAppmapContractId: (state: any) => {
      return state.appmapContractId
    },
    getAppmapCounter: (state: any) => {
      return state.appCounter
    },
    getAppmapProject: (state: any) => projectId => {
      const index = state.appmap.apps.findIndex((o) => o.contractId === projectId)
      if (index > -1) {
        return state.appmap.apps[index]
      }
    },
    getApplication: (state: any) => appCounter => {
      const index = state.appmap.apps.findIndex((o) => o.appCounter === appCounter)
      if (index > -1) {
        return state.appmap.apps[index]
      }
    },
    getGaiaProject: (state: any) => projectId => {
      // note a user might store multiple projects in their gaia space
      const index = state.gaiaProjects.findIndex((o) => o.projectId === projectId)
      if (index > -1) {
        return state.gaiaProjects[index]
      }
    }
  },
  mutations: {
    rootFile (state: any, rootFile: any) {
      state.rootFile = rootFile
    },
    setAppCounter (state, appCounter) {
      state.appCounter = appCounter
    },
    setGaiaProjects (state, gaiaProjects) {
      let index = -1
      gaiaProjects.forEach((project) => {
        index = state.gaiaProjects.findIndex((o) => o.projectId === project.projectId)
        if (index < 0) {
          state.gaiaProjects.splice(0, 0, project)
        } else {
          state.gaiaProjects.splice(index, 1, project)
        }
      })
    },
    setAppmap (state, appmap) {
      state.appmap = appmap
    },
    addBaseTokenUriToAppmap (state, data) {
      const index = state.appmap.apps.findIndex((o) => o.appCounter === data.application.appCounter)
      if (index > -1) {
        state.appmap.apps[index].baseTokenUri = data.baseTokenUri
      }
    },
    addAppToAppmap (state, application) {
      const index = state.appmap.apps.findIndex((o) => o.appCounter === application.appCounter)
      if (index < 0) {
        state.appmap.apps.splice(application.appCounter, 0, application)
      } else {
        state.appmap.apps.splice(index, 1, application)
      }
    },
    addTradeInfoToAppmap (state, data) {
      const index1 = state.appmap.apps.findIndex((o) => o.contractId === data.application.contractId)
      if (index1 > -1) {
        const application = state.appmap.apps[index1]
        if (application && application.clarityAssets) {
          const index = application.clarityAssets.findIndex((o) => o.nftIndex === data.nftIndex)
          if (index > -1) {
            application.clarityAssets[index].tradeInfo = data.tradeInfo
          }
        }
      }
    },
    addClarityAssetToAppmap (state, data) {
      const index1 = state.appmap.apps.findIndex((o) => o.appCounter === data.application.appCounter)
      if (index1 > -1) {
        const application = state.appmap.apps[index1]
        const index = application.clarityAssets.findIndex((o) => o.assetHash === data.asset.assetHash)
        if (index < 0) {
          state.appmap.apps[index1].clarityAssets.splice(0, 0, data.asset)
        } else {
          state.appmap.apps[index1].clarityAssets.splice(index, 1, data.asset)
        }
      }
    }
  },
  actions: {
    lookupApplications ({ state, commit, dispatch }: any) {
      return new Promise((resolve, reject) => {
        store.dispatch('stacksStore/callContractReadOnly', { contractId: state.appmapContractId, functionName: 'get-app-counter' }).then((appCounter) => {
          commit('setAppCounter', appCounter)
          for (let i = 0; i < state.appCounter; i++) {
            dispatch('lookupApplicationByIndex', i)
          }
        }).catch((e) => {
          reject(e)
        })
      })
    },
    lookupApplicationByIndex: function ({ state, commit, dispatch, getters }: any, appCounter: number) {
      return new Promise(function (resolve, reject) {
        const index = state.appmap.apps.findIndex((o) => o.appCounter === appCounter)
        if (index > -1) {
          resolve(state.appmap.apps[index])
          return
        }
        const functionArgs = [`0x${serializeCV(intCV(appCounter)).toString('hex')}`]
        const config = {
          contractId: state.appmapContractId,
          functionName: 'get-app',
          functionArgs: functionArgs
        }
        store.dispatch('stacksStore/callContractReadOnly', config).then((application) => {
          application.appCounter = appCounter
          dispatch('fetchApplicationBaseTokenAddress', application)
          commit('addAppToAppmap', application)
          const gaiaProject = getters[KEY_GAIA_PROJECT](application.contractId)
          if (!gaiaProject) {
            projectService.fetchUserProjects(application.owner).then((gaiaProjects) => {
              commit('setGaiaProjects', gaiaProjects)
              const gp = getters[KEY_GAIA_PROJECT](application.contractId)
              application.gaiaProject = gp
              commit('addAppToAppmap', application)
              dispatch('lookupMintCounter', application)
              resolve(application)
            }).catch(() => {
              dispatch('lookupMintCounter', application)
              resolve(application)
            })
          } else {
            resolve(application)
          }
        }).catch((e) => {
          reject(e)
        })
      })
    },
    lookupMintCounter ({ dispatch, commit }: any, application: any) {
      return new Promise((resolve, reject) => {
        store.dispatch('stacksStore/callContractReadOnly', { contractId: application.contractId, functionName: 'get-mint-counter' }).then((mintCounter) => {
          application.mintCounter = mintCounter
          application.clarityAssets = []
          commit('addAppToAppmap', application)
          application.numberCalls = 0
          resolve(application)
          application.clarityAssets = []
          for (let i = 0; i < application.mintCounter; i++) {
            dispatch('lookupMintedAssets', { application: application, index: i })
          }
        }).catch((e) => {
          reject(e)
        })
      })
    },
    indexMintedAssets: function ({ state, dispatch }: any) {
      return new Promise((resolve) => {
        state.appmap.apps.forEach((application) => {
          application.numberCalls = 0
          for (let i = 0; i < application.mintCounter; i++) {
            dispatch('lookupMintedAssets', { application: application, index: i })
          }
        })
        resolve('Indexing underway - please don\'t refresh or close this tab..')
      })
    },
    lookupMintedAssets: function ({ state, commit }: any, appdata: any) {
      return new Promise(function (resolve, reject) {
        const functionArgs = [`0x${serializeCV(uintCV(appdata.index)).toString('hex')}`]
        const config = {
          contractId: appdata.application.contractId,
          functionName: 'get-token-info-full',
          functionArgs: functionArgs
        }
        store.dispatch('stacksStore/callContractReadOnly', config).then((clarityAsset) => {
          // const buffer = `0x${serializeCV(bufferCV(Buffer.from(clarityAsset.assetHash, 'hex'))).toString('hex')}` // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
          // const myConfig = {
          //  contractId: appdata.application.contractId,
          //  functionName: 'get-index',
          //  functionArgs: [buffer]
          // }
          // store.dispatch('stacksStore/callContractReadOnly', myConfig).then((nftIndex) => {
          clarityAsset.nftIndex = appdata.index
          appdata.application.numberCalls++
          commit('addClarityAssetToAppmap', { application: appdata.application, asset: clarityAsset })
          if (appdata.application.mintCounter && appdata.application.numberCalls >= appdata.application.mintCounter) {
            searchIndexService.addRecords(appdata.application)
            resolve(state.appmap.apps[appdata.application.appCounter])
          } else if (!appdata.application.mintCounter) {
            resolve(clarityAsset)
          }
          /**
          dispatch('lookupTradeInfo', { application: appdata.application, nftIndex: nftIndex }).then((tradeInfo) => {
            clarityAsset.tradeInfo = tradeInfo
            commit('addClarityAssetToAppmap', { application: appdata.application, asset: clarityAsset })
            resolve(clarityAsset)
            if (appdata.application.numberCalls >= appdata.application.mintCounter) {
              searchIndexService.addRecords(appdata.application)
            }
          }).catch(() => {
            if (appdata.application.numberCalls >= appdata.application.mintCounter) {
              searchIndexService.addRecords(appdata.application)
            }
          })
          **/
          // }).catch((e) => {
          //  reject(e)
          // })
        }).catch((e) => {
          reject(e)
        })
      })
    },
    lookupTradeInfo: function ({ commit }: any, data: any) {
      return new Promise((resolve, reject) => {
        const functionArgs = [`0x${serializeCV(uintCV(data.nftIndex)).toString('hex')}`]
        const config = {
          contractId: data.application.contractId,
          functionName: 'get-sale-data',
          functionArgs: functionArgs
        }
        store.dispatch('stacksStore/callContractReadOnly', config).then((tradeInfo) => {
          data.tradeInfo = tradeInfo
          commit('addTradeInfoToAppmap', data)
          resolve(tradeInfo)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchApplicationBaseTokenAddress: function ({ commit }: any, application: any) {
      return new Promise(function (resolve, reject) {
        const config = {
          contractId: application.contractId,
          functionName: 'get-base-token-uri',
          functionArgs: []
        }
        store.dispatch('stacksStore/callContractReadOnly', config).then((baseTokenUri) => {
          commit('addBaseTokenUriToAppmap', { application: application, baseTokenUri: baseTokenUri })
          resolve(application)
        }).catch((e) => {
          reject(e)
        })
      })
    }
  }
}
export default applicationStore
