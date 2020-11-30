import store from '@/store'
import utils from '@/services/utils'
import { APP_CONSTANTS } from '@/app-constants'
import {
  makeContractCall,
  broadcastTransaction,
  makeContractDeploy,
  callReadOnlyFunction,
  uintCV, bufferCV,
  standardPrincipalCV
} from '@stacks/transactions'
import { openContractCall, FinishedTxData } from '@stacks/connect'
import {
  StacksTestnet
} from '@stacks/network'
import axios from 'axios'
import BigNum from 'bn.js'
import searchIndexService from '@/services/searchIndexService'

let STX_CONTRACT_ADDRESS = process.env.VUE_APP_STACKS_CONTRACT_ADDRESS
let STX_CONTRACT_NAME = process.env.VUE_APP_STACKS_CONTRACT_NAME
const mac = JSON.parse(process.env.VUE_APP_WALLET_MAC || '')
const sky = JSON.parse(process.env.VUE_APP_WALLET_SKY || '')
const contractDeployFee = 10000

const STACKS_API = process.env.VUE_APP_API_STACKS
const STACKS_API_EXT = process.env.VUE_APP_API_STACKS_EXT
const STACKS_POLLING = process.env.VUE_APP_API_POLLING
const MESH_API = process.env.VUE_APP_API_MESH
// const network = new StacksTestnet()
// network.coreApiUrl = STACKS_API
let provider = 'connect'
if (MESH_API.indexOf('local') > -1) {
  provider = 'risidio'
}
const setAddresses = function () {
  const config = store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
  if (config && config.addresses) {
    STX_CONTRACT_ADDRESS = config.addresses.stxContractAddress
    STX_CONTRACT_NAME = config.addresses.stxContractName
  }
}
const pollTxStatus = function (dispatch, txId) {
  return new Promise((resolve) => {
    let counter = 0
    if (!STACKS_POLLING) return
    const intval = setInterval(function () {
      axios.get(STACKS_API_EXT + '/extended/v1/tx/' + txId).then(response => {
        const meth1 = 'tx_status'
        if (response[meth1] === 'success') {
          const meth2 = 'tx_status'
          const hexResolved = utils.fromHex(response[meth2].hex)
          resolve(hexResolved)
          clearInterval(intval)
        }
      }).catch((e) => {
        console.log(e)
      })
      if (counter === 30) {
        clearInterval(intval)
        resolve()
      }
      counter++
    }, 5000)
  })
}
const handleSetTradeInfo = function (asset, result, resolve) {
  asset.hexResp = (result && result.data) ? result.data : ''
  // if (asset.tradeInfo.biddingEndTime && typeof asset.tradeInfo.biddingEndTime === 'string' && asset.tradeInfo.biddingEndTime.indexOf('-') > -1) {
  //  asset.tradeInfo.biddingEndTime = moment(asset.tradeInfo.biddingEndTime).valueOf()
  // }
  searchIndexService.addTradeInfo(asset).then(() => {
    console.log(asset)
    resolve(asset)
  }).catch((error) => {
    console.log(error)
    resolve(asset)
  })
}
const handleBuyNow = function (asset, result, resolve, purchaseInfo) {
  asset.owner = purchaseInfo.buyer
  asset.hexResp = (result && result.data) ? result.data : ''
  searchIndexService.addRecord(asset).then(() => {
    console.log(asset)
    resolve(asset)
  }).catch((error) => {
    console.log(error)
    resolve(asset)
  })
}

const postDeploy = function (resolve, dispatch, projectId, contractId, txId) {
  store.dispatch('projectStore/updateProject', { projectId: projectId, contractId: contractId, txId: txId }).then((project) => {
    dispatch('fetchMacSkyWalletInfo')
    resolve(project)
  })
}
const resolveError = function (reject, error) {
  if (!error) {
    reject('Error happened')
  }
  if (error.response && error.response.data) {
    if (error.response.data.error) {
      let msg = 'Transaction rejected: ' + error.response.data.reason
      if (error.response.data.reason_data) {
        msg += JSON.stringify(error.response.data.reason_data)
      }
      reject(new Error(msg))
    } else if (error.response.data.message) {
      if (error.response.data.message.indexOf('NotEnoughFunds') > -1) {
        reject(new Error('Not enough funds in the wallet to send this - try decreasing the amount?'))
      } else if (error.response.data.message.indexOf('ConflictingNonceInMempool') > -1) {
        reject(new Error('Conflicting Nonce In Mempool!'))
      } else {
        reject(new Error(error.response.data.message))
      }
    } else {
      if (error.response && error.response.data) {
        reject(new Error(error.response.data))
      } else {
        reject(new Error('no error.response.data'))
      }
    }
  } else if (error.message) {
    reject(error.message)
  } else {
    reject(error)
  }
}
const stacksStore = {
  namespaced: true,
  state: {
    provider: provider,
    result: null,
    contracts: [],
    appName: 'Risidio Auctions',
    appLogo: '/img/Group 15980.svg',
    macsWallet: mac,
    skysWallet: sky
  },
  getters: {
    getWalletMode: state => {
      return state.provider
    },
    getMacsWallet: state => {
      return state.macsWallet
    },
    getSkysWallet: state => {
      return state.skysWallet
    }
  },
  mutations: {
    setMacsWallet (state, wallet) {
      if (wallet.label === 'mac') {
        state.macsWallet = wallet
      } else if (wallet.label === 'sky') {
        state.skysWallet = wallet
      }
    },
    setResult (state, result) {
      state.result = result
    },
    toggleWalletMode (state) {
      if (state.provider === 'risidio') {
        state.provider = 'connect'
      } else {
        state.provider = 'risidio'
      }
    }
  },
  actions: {
    fetchMacSkyWalletInfo ({ dispatch, state }) {
      return new Promise((resolve) => {
        dispatch('fetchWalletInternal', state.macsWallet).then((wallet) => {
          resolve(wallet)
          dispatch('fetchWalletInternal', state.skysWallet).then((wallet) => {
            resolve(wallet)
          })
        })
      })
    },
    fetchWalletInternal ({ state, commit }, wallet) {
      return new Promise((resolve, reject) => {
        const data = {
          path: '/v2/accounts/' + wallet.keyInfo.address,
          httpMethod: 'get',
          postData: null
        }
        axios.post(MESH_API + '/v2/accounts', data).then(response => {
          wallet.nonce = response.data.nonce
          wallet.balance = utils.fromOnChainAmount(response.data.balance)
          commit('setMacsWallet', wallet)
          resolve(wallet)
        }).catch(() => {
          const wallet = state.wallet
          const useApi = STACKS_API + '/v2/accounts/' + wallet.keyInfo.address
          axios.get(useApi).then(response => {
            wallet.nonce = response.data.nonce
            wallet.balance = utils.fromOnChainAmount(response.data.balance)
            commit('setMacsWallet', wallet)
            resolve(wallet)
          }).catch((error) => {
            resolveError(reject, error)
          })
        })
      })
    },
    callContractBlockstack ({ state }, data) {
      // see https://docs.blockstack.org/smart-contracts/signing-transactions
      // Blocked a frame with origin "https://loopbomb.risidio.com" from accessing a cross-origin frame.
      return new Promise((resolve, reject) => {
        const contractAddress = (data.contractAddress) ? data.contractAddress : STX_CONTRACT_ADDRESS
        const contractName = (data.contractName) ? data.contractName : STX_CONTRACT_NAME
        // const nonce = new BigNum(state.macsWallet.nonce)
        // network.coreApiUrl = STACKS_API
        const txoptions: any = {
          contractAddress: contractAddress,
          contractName: contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          // network: network,
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: (response: FinishedTxData) => {
            const result = {
              txId: response.txId,
              txRaw: response.txRaw,
              network: 15
            }
            resolve(result)
          }
        }
        openContractCall(txoptions).catch((error) => {
          reject(error)
        })
      })
    },
    callContractRisidio ({ state, dispatch }, data) {
      return new Promise((resolve, reject) => {
        setAddresses()
        const profile = store.getters['authStore/getMyProfile']
        if (!data.senderKey) {
          data.senderKey = profile.senderKey
        }
        const wallet = (data.wallet) ? data.wallet : state.macsWallet
        let nonce = new BigNum(wallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(wallet.nonce + 1)
        }
        const network = new StacksTestnet()
        const txOptions = {
          contractAddress: (data.contractAddress) ? data.contractAddress : STX_CONTRACT_ADDRESS,
          contractName: (data.contractName) ? data.contractName : STX_CONTRACT_NAME,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          fee: new BigNum(1800),
          senderKey: wallet.keyInfo.privateKey,
          nonce: new BigNum(nonce),
          network
        }
        makeContractCall(txOptions).then((transaction) => {
          if (state.provider !== 'risidio') {
            const network = new StacksTestnet()
            broadcastTransaction(transaction, network).then((result) => {
              resolve(result)
            }).catch((error) => {
              reject(error)
            })
          } else {
            const txdata = new Uint8Array(transaction.serialize())
            const headers = {
              'Content-Type': 'application/octet-stream'
            }
            axios.post(MESH_API + '/v2/broadcast', txdata, { headers: headers }).then(response => {
              pollTxStatus(dispatch, response.data).then((txResponse) => {
                console.log(txResponse)
              })
              resolve(response)
              dispatch('fetchMacSkyWalletInfo')
            }).catch(() => {
              const useApi = STACKS_API + '/v2/transactions'
              axios.post(useApi, txdata).then((response) => {
                pollTxStatus(dispatch, response.data).then((txResponse) => {
                  console.log(txResponse)
                })
                resolve(response)
                dispatch('fetchMacSkyWalletInfo')
              }).catch((error) => {
                resolveError(reject, error)
              })
            })
          }
        })
      })
    },
    callContractBlockstackReadOnly ({ state }, data) {
      return new Promise((resolve, reject) => {
        let contractAddress = STX_CONTRACT_ADDRESS
        let contractName = STX_CONTRACT_NAME
        if (data.contractId) {
          contractAddress = data.contractId.split('.')[0]
          contractName = data.contractId.split('.')[1]
        }
        callReadOnlyFunction({
          contractAddress: contractAddress,
          contractName: contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          senderAddress: state.macsWallet.keyInfo.address
        }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    callContractReadOnly ({ state, dispatch }, data) {
      return new Promise((resolve, reject) => {
        setAddresses()
        if (state) {
          console.log(state)
        }
        let contractAddress = STX_CONTRACT_ADDRESS
        let contractName = STX_CONTRACT_NAME
        if (data.contractId) {
          contractAddress = data.contractId.split('.')[0]
          contractName = data.contractId.split('.')[1]
        }
        const path = '/v2/contracts/call-read/' + contractAddress + '/' + contractName + '/' + data.functionName
        const txoptions = {
          path: path,
          httpMethod: 'POST',
          postData: {
            arguments: (data.functionArgs) ? data.functionArgs : [],
            sender: contractAddress
          }
        }
        const headers = {
          'Content-Type': 'application/json'
        }
        axios.post(MESH_API + '/v2/accounts', txoptions).then(response => {
          dispatch('fetchMacSkyWalletInfo')
          data.result = utils.fromHex(data.functionName, response.data.result)
          resolve(data.result)
        }).catch((error) => {
          axios.post(STACKS_API + path, txoptions.postData, { headers: headers }).then(response => {
            dispatch('fetchMacSkyWalletInfo')
            data.result = utils.fromHex(data.functionName, response.data.result)
            resolve(data.result)
          }).catch(() => {
            resolveError(reject, error)
          })
        })
      })
    },
    lookupContractInterface ({ commit }, projectId) {
      return new Promise((resolve, reject) => {
        const contractAddress = projectId.split('.')[0]
        const contractName = projectId.split('.')[1]
        const txoptions = {
          path: '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0',
          httpMethod: 'GET'
        }
        axios.post(MESH_API + '/v2/accounts', txoptions).then(response => {
          store.commit('projectStore/addContractData', { projectId: projectId, interface: response.data })
          commit('setResult', { projectId: projectId, interface: response.data })
          resolve({ projectId: projectId, interface: response.data })
        }).catch(() => {
          axios.get(STACKS_API + '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0').then(response => {
            store.commit('projectStore/addContractData', { projectId: projectId, interface: response.data })
            commit('setResult', { projectId: projectId, interface: response.data })
            resolve({ projectId: projectId, interface: response.data })
          }).catch((error) => {
            resolveError(reject, error)
          })
        })
      })
    },
    lookupContractInfo ({ commit }, projectId) {
      return new Promise((resolve, reject) => {
        const address = STACKS_API.replace('20443', '3999')
        axios.get(address + '/extended/v1/contract/' + projectId + '?proof=0').then(response => {
          store.commit('projectStore/addContractData', { projectId: projectId, info: response.data })
          commit('setResult', { projectId: projectId, info: response.data })
          resolve({ projectId: projectId, interface: response.data })
        }).catch((error) => {
          resolveError(reject, error)
        })
      })
    },
    deployProjectContract ({ state, dispatch }, project) {
      return new Promise((resolve, reject) => {
        const sender = state.macsWallet
        const contractName = project.projectId.split('.')[1]
        const contractId = mac.keyInfo.address + '.' + contractName
        const network = new StacksTestnet()
        const txOptions = {
          contractName: contractName,
          codeBody: project.codeBody,
          senderKey: mac.keyInfo.privateKey,
          nonce: new BigNum(sender.nonce++), // watch for nonce increments if this works - may need to restart mocknet!
          fee: new BigNum(contractDeployFee), // set a tx fee if you don't want the builder to estimate
          network
        }
        makeContractDeploy(txOptions).then((transaction) => {
          const txdata = new Uint8Array(transaction.serialize())
          const headers = {
            'Content-Type': 'application/octet-stream'
          }
          axios.post(MESH_API + '/v2/broadcast', txdata, { headers: headers }).then(response => {
            postDeploy(resolve, dispatch, project.projectId, contractId, response.data)
          }).catch(() => {
            const useApi = STACKS_API + '/v2/transactions'
            axios.post(useApi, txdata, { headers: { 'Content-Type': 'application/octet-stream' } }).then(response => {
              postDeploy(resolve, dispatch, project.projectId, contractId, response.data)
            }).catch((error) => {
              console.log('Error broadcasting tx.. ', error)
              resolveError(reject, error)
            })
          })
        }).catch((error) => {
          resolveError(reject, error)
        })
      })
    },
    setTradeInfo ({ state, dispatch }, asset) {
      return new Promise((resolve, reject) => {
        // (asset-hash (buff 32)) (sale-type uint) (increment-stx uint) (reserve-stx uint) (amount-stx uint)
        const buffer = bufferCV(Buffer.from(asset.assetHash, 'hex')) // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
        const saleType = uintCV(asset.tradeInfo.saleType)
        const incrementPrice = uintCV(utils.toOnChainAmount(asset.tradeInfo.incrementPrice))
        const reservePrice = uintCV(utils.toOnChainAmount(asset.tradeInfo.reservePrice))
        const buyNowOrStartingPrice = uintCV(utils.toOnChainAmount(asset.tradeInfo.buyNowOrStartingPrice))
        const biddingEndTime = uintCV(asset.tradeInfo.biddingEndTime)
        const functionArgs = [buffer, saleType, incrementPrice, reservePrice, buyNowOrStartingPrice, biddingEndTime]
        const data: any = {
          contractAddress: asset.projectId.split('.')[0],
          contractName: asset.projectId.split('.')[1],
          functionName: 'set-sale-data',
          functionArgs: functionArgs
        }
        const methos = (state.provider === 'risidio') ? 'callContractRisidio' : 'callContractBlockstack'
        dispatch(methos, data).then((result) => {
          handleSetTradeInfo(asset, result, resolve)
        }).catch(() => {
          data.action = 'inc-nonce'
          dispatch(methos, data).then((result) => {
            handleSetTradeInfo(asset, result, resolve)
          }).catch((error) => {
            reject(error)
          })
        })
      })
    },
    buyNow ({ state, dispatch }, purchaseInfo) {
      return new Promise((resolve, reject) => {
        // (asset-hash (buff 32)) (sale-type uint) (increment-stx uint) (reserve-stx uint) (amount-stx uint)
        const asset = purchaseInfo.asset
        const nftIndex = uintCV(asset.nftIndex)
        const spCV = standardPrincipalCV(mac.keyInfo.address)
        const functionArgs = [spCV, nftIndex]
        const data: any = {
          contractAddress: asset.projectId.split('.')[0],
          contractName: asset.projectId.split('.')[1],
          functionName: 'transfer',
          functionArgs: functionArgs,
          wallet: (state.provider === 'risidio' && purchaseInfo.useWallet && purchaseInfo.useWallet === 'sky') ? state.skysWallet : state.macsWallet
        }
        const methos = (state.provider === 'risidio') ? 'callContractRisidio' : 'callContractBlockstack'
        dispatch(methos, data).then((result) => {
          handleBuyNow(asset, result, resolve, purchaseInfo)
        }).catch(() => {
          data.action = 'inc-nonce'
          dispatch(methos, data).then((result) => {
            handleBuyNow(asset, result, resolve, purchaseInfo)
          }).catch((error) => {
            reject(error)
          })
        })
      })
    }
  }
}
export default stacksStore
