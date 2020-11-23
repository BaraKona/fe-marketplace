import dataUriToBuffer from 'data-uri-to-buffer'
import {
  hexToCV
} from '@stacks/transactions'

const utils = {
  fetchBase64FromImageUrl: function (url, document) {
    return new Promise((resolve) => {
      const img = new Image()
      img.setAttribute('crossOrigin', 'anonymous')
      img.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(this, 0, 0)
        const dataURL = canvas.toDataURL('image/png')
        const mimeType = dataURL.substring(dataURL.indexOf(':') + 1, dataURL.indexOf(';')) // => image/png
        const imageBuffer = dataUriToBuffer(dataURL)
        resolve({ dataURL: dataURL, imageBuffer: imageBuffer, mimeType: mimeType })
      }
      img.src = url
    })
  },
  getBase64FromImageUrl: function (dataURL) {
    const imageBuffer = dataUriToBuffer(dataURL)
    // const rawImage = dataURL.replace(/^data:image\/(png|jpg);base64,/, '')
    const mimeType = dataURL.substring(dataURL.indexOf(':') + 1, dataURL.indexOf(';')) // => image/png
    return { imageBuffer: imageBuffer, mimeType: mimeType }
  },
  stringToHex: function (str) {
    const arr = []
    for (let i = 0; i < str.length; i++) {
      arr[i] = (str.charCodeAt(i).toString(16)).slice(-4)
    }
    return '0x' + arr.join('')
  },
  fromHex: function (method, rawResponse) {
    const td = new TextDecoder('utf-8')
    const res = hexToCV(rawResponse)
    if (rawResponse.startsWith('0x08')) {
      throw new Error('Blockchain call returned not okay with error code: ' + res.value.value.toNumber())
    }
    if (method === 'get-mint-price') {
      return res.value.value.toNumber()
    } else if (method === 'get-index') {
      return res.value.value.toNumber()
    } else if (method === 'get-mint-counter') {
      return res.value.value.toNumber()
    } else if (method === 'get-app-counter') {
      return res.value.value.toNumber()
    } else if (method === 'get-app') {
      return {
        // owner: td.decode(res.value.data.owner.buffer),
        contractId: td.decode(res.value.data['app-contract-id'].buffer),
        status: res.value.data.status.value.toNumber(),
        storageModel: res.value.data['storage-model'].value.toNumber()
      }
    } else if (method === 'get-token-info') {
      return {
        // owner: td.decode(res.value.data.owner.buffer),
        assetHash: res.value.data['asset-hash'].buffer.toString('hex'),
        date: res.value.data.date.value.toNumber()
      }
    } else if (method === 'get-sale-data') {
      return {
        biddingEndTime: res.value.data['bidding-end-time'].value.toNumber(),
        incrementPrice: res.value.data['increment-stx'].value.toNumber(),
        reservePrice: res.value.data['reserve-stx'].value.toNumber(),
        buyNowOrStartingPrice: res.value.data['amount-stx'].value.toNumber(),
        saleType: res.value.data['sale-type'].value.toNumber()
      }
    } else if (method === 'get-base-token-uri') {
      return td.decode(res.buffer)
    }
  }
}
export default utils
