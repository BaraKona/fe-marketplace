import store from '@/store'
import { APP_CONSTANTS } from '@/app-constants'
import {
  StacksTestnet,
  makeContractCall,
  broadcastTransaction,
  makeContractDeploy
} from '@blockstack/stacks-transactions'
import axios from 'axios'
import BigNum from 'bn.js'

let STX_CONTRACT_ADDRESS = process.env.VUE_APP_STACKS_CONTRACT_ADDRESS
let STX_CONTRACT_NAME = process.env.VUE_APP_STACKS_CONTRACT_NAME
const network = new StacksTestnet()
const mac = JSON.parse(process.env.VUE_APP_WALLET_MAC || '')
const precision = 1000000

const STACKS_API = process.env.VUE_APP_API_STACKS
const MESH_API = process.env.VUE_APP_API_MESH

/**
const getStacksAccount = function (appPrivateKey) {
  const privateKey = createStacksPrivateKey(appPrivateKey)
  const publicKey = getPublicKey(privateKey)
  const address = addressFromPublicKeys(
    AddressVersion.TestnetSingleSig,
    AddressHashMode.SerializeP2PKH,
    1,
    [publicKey]
  )
  return { privateKey, address }
}
**/
const setAddresses = function () {
  const config = store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
  if (config && config.addresses) {
    STX_CONTRACT_ADDRESS = config.addresses.stxContractAddress
    STX_CONTRACT_NAME = config.addresses.stxContractName
  }
}

function unwrapStrings (tuple, type) {
  const names = tuple.match(/0x\w+/g) || []
  let name
  if (!type) {
    name = Buffer.from(names[0].substring(2), 'hex').toString()
  } else {
    // name = new Uint32Array(Buffer.from(names[0].substring(2), 'hex'))
    name = Buffer.from(names[0].substring(2), 'hex')
    name = new Float64Array(name)
  }
  return name
}
/**
function DoubleToIEEE(f) {
  var buf = new ArrayBuffer(8);
  var float = new Float64Array(buf);
  var uint = new Uint32Array(buf);
  float[0] = f;
  return uint;
}
**/

const getAmountStx = function (amountMicroStx) {
  try {
    if (typeof amountMicroStx === 'string') {
      amountMicroStx = Number(amountMicroStx)
    }
    if (amountMicroStx === 0) return 0
    amountMicroStx = amountMicroStx / precision
    return Math.round(amountMicroStx * precision) / precision
  } catch {
    return 0
  }
}
const postDeploy = function (resolve, dispatch, projectId, contractId, txId) {
  store.dispatch('projectStore/updateProject', { projectId: projectId, contractId: contractId, txId: txId }).then((project) => {
    dispatch('fetchMacsWalletInfo')
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
      reject(new Error(error.response))
    }
  } else if (error.message) {
    reject(error.message)
  } else {
    reject(error)
  }
}
const resolveReadOnly = function (resolve, reject, functionName, response) {
  if (!response.data.okay) {
    reject(new Error('not okay'))
  } else {
    if (functionName === 'get-mint-price') {
      const res = getAmountStx(parseInt(response.data.result, 16))
      resolve(res)
    } else {
      const res = unwrapStrings(response.data.result, 'uint')
      resolve(res)
    }
  }
}
const stacksStore = {
  namespaced: true,
  state: {
    provider: 'risidio',
    result: null,
    contracts: [],
    appName: 'Risidio Mesh',
    appLogo: '/img/logo/Risidio_logo_256x256.png',
    macsWallet: mac
  },
  getters: {
    getMacsWallet: state => {
      return state.macsWallet
    }
  },
  mutations: {
    setMacsWallet (state, newMac) {
      state.macsWallet = newMac
    },
    setResult (state, result) {
      state.result = result
    }
  },
  actions: {
    fetchMacsWalletInfo ({ state, commit }) {
      return new Promise((resolve, reject) => {
        const macsWallet = state.macsWallet
        const data = {
          path: '/v2/accounts/' + macsWallet.keyInfo.address,
          httpMethod: 'get',
          postData: null
        }
        axios.post(MESH_API + '/v2/accounts', data).then(response => {
          macsWallet.nonce = response.data.nonce
          macsWallet.balance = getAmountStx(parseInt(response.data.balance, 16))
          commit('setMacsWallet', macsWallet)
          resolve(macsWallet)
        }).catch(() => {
          const macsWallet = state.macsWallet
          const useApi = STACKS_API + '/v2/accounts/' + macsWallet.keyInfo.address
          axios.get(useApi).then(response => {
            macsWallet.nonce = response.data.nonce
            macsWallet.balance = getAmountStx(parseInt(response.data.balance, 16))
            commit('setMacsWallet', macsWallet)
            resolve(macsWallet)
          }).catch((error) => {
            resolveError(reject, error)
          })
        })
      })
    },
    callContractRisidio ({ state, commit }, data) {
      return new Promise((resolve, reject) => {
        setAddresses()
        const profile = store.getters['authStore/getMyProfile']
        if (!data.senderKey) {
          data.senderKey = profile.senderKey
        }
        let nonce = new BigNum(state.wallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(state.wallet.nonce + 1)
        }
        // 5000 000 000 000 000
        const txOptions = {
          contractAddress: STX_CONTRACT_ADDRESS,
          contractName: STX_CONTRACT_NAME,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          fee: new BigNum(1800),
          senderKey: state.wallet.keyInfo.privateKey,
          nonce: new BigNum(nonce),
          validateWithAbi: false,
          network
        }
        makeContractCall(txOptions).then((transaction) => {
          if (state.provider !== 'risidio') {
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
              const result = {
                txId: response.data,
                network: 15,
                tokenId: Math.floor(Math.random() * Math.floor(1000000000))
              }
              resolve(result)
            }).catch(() => {
              const macsWallet = state.macsWallet
              const useApi = STACKS_API + '/v2/transactions'
              axios.post(useApi, txdata).then(response => {
                macsWallet.nonce = response.data.nonce
                macsWallet.balance = getAmountStx(parseInt(response.data.balance, 16))
                commit('setMacsWallet', macsWallet)
                resolve(macsWallet)
              }).catch((error) => {
                resolveError(reject, error)
              })
            })
          }
        })
      })
    },
    callContractReadOnly ({ state }, data) {
      return new Promise((resolve, reject) => {
        setAddresses(state)
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
          resolveReadOnly(resolve, reject, data.functionName, response)
        }).catch(() => {
          axios.post(STACKS_API + path, txoptions.postData, { headers: headers }).then(response => {
            resolveReadOnly(resolve, reject, data.functionName, response)
          }).catch((error) => {
            resolveError(reject, error)
          })
        }).catch((error) => {
          resolveError(reject, error)
        })
      })
    },
    lookupContractInterface ({ commit }, projectId) {
      return new Promise((resolve, reject) => {
        const contractAddress = projectId.split('.')[0]
        const contractName = projectId.split('.')[1]
        axios.get(STACKS_API + '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0').then(response => {
          store.commit('projectStore/addContractData', { projectId: projectId, interface: response.data })
          commit('setResult', { projectId: projectId, interface: response.data })
          resolve({ projectId: projectId, interface: response.data })
        }).catch((error) => {
          resolveError(reject, error)
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
        network.coreApiUrl = 'http://localhost:20443'
        const sender = state.macsWallet
        const contractName = project.projectId.split('.')[1]
        const contractId = mac.keyInfo.address + '.' + contractName
        const txOptions = {
          contractName: contractName,
          codeBody: project.codeBody,
          senderKey: mac.keyInfo.privateKey,
          nonce: new BigNum(sender.nonce++), // watch for nonce increments if this works - may need to restart mocknet!
          fee: new BigNum(4000), // set a tx fee if you don't want the builder to estimate
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
    }
  }
}
export default stacksStore
