<template>
<div v-if="!registry">
  <p>No applciation registry detected - are the contracts deployed?</p>
</div>
<div v-else>
  <div>
    <div class="col-md-12">
      <b-form>
        <div class="mb-2">
          <div class="mb-2">Contract Id <a href="#" @click.prevent="useMyAddress()">(use my address)</a></div>
          <b-input
            id="projectId"
            ref="projectId"
            v-model="project.projectId"
            class="mt-3"></b-input>
        </div>
        <div class="mb-2" v-if="valid() && project">
          <deploy-contract-from-file :project="project" @deployed="deployed"/>
        </div>
      </b-form>
    </div>
  </div>
<div class="upload-preview bg-danger text-white  my-5 p-4" v-if="registry">
  <div class="row border-bottom mb-3 pb-2">
    <div class="col-12"><h3>All Contract Data</h3></div>
    <div class="col-2">Administrator</div><div class="col-10">{{registry.administrator}}</div>
    <div class="col-2">Admin Contract Address</div><div class="col-10">{{registry.adminContractAddress}}</div>
    <div class="col-2">Admin Contract Name</div><div class="col-10">{{registry.adminContractName}}</div>
    <div class="col-2">Apps Connected</div><div class="col-10">{{registry.appCounter}}</div>
  </div>
  <div class="row border-bottom mb-3 pb-2" v-for="(application, index) in registry.applications" :key="index">
    <div class="col-2">Contract Id</div><div class="col-10">{{application.contractId}}</div>
    <div class="col-2">Owner</div><div class="col-10">{{application.owner}}</div>
    <div class="col-2">App-Index</div><div class="col-10">{{application.appIndex}}</div>
    <div class="col-2">Storage</div><div class="col-10">{{application.storageModel}}</div>
    <div class="col-2">Status</div><div class="col-10">{{application.status}}</div>
      <div class="row ml-3 p-3" v-if="application.tokenContract">
        <div class="col-2">Token Contract</div><div class="col-10 text-bold">{{application.tokenContract.tokenSymbol}} - {{application.tokenContract.tokenName}}</div>
        <div class="col-2">Base URL</div><div class="col-10">{{application.tokenContract.baseTokenUri}}</div>
        <div class="col-2">administrator</div><div class="col-10">{{application.tokenContract.administrator}}</div>
        <div class="col-2">Platform</div><div class="col-10">{{application.tokenContract.platformFee}}</div>
        <div class="col-2">Minted</div><div class="col-10">{{application.tokenContract.mintCounter}}</div>
        <div class="row ml-4 mt-3 border-bottom mb-3 pb-2" v-for="(token, index) in application.tokenContract.tokens" :key="index">
          <div class="col-2 my-2">
            <div v-if="gaiaAsset(token.tokenInfo.assetHash)"><img width="70px" :src="gaiaAsset(token.tokenInfo.assetHash).image"/></div>
          </div>
          <div class="col-10 my-2" v-if="gaiaAsset(token.tokenInfo.assetHash)">
            <div>{{gaiaAsset(token.tokenInfo.assetHash).name}}</div>
            <div>[#{{token.nftIndex}}] : Edition {{token.tokenInfo.edition}} / {{token.tokenInfo.maxEditions}} / {{token.tokenInfo.editionCost}}</div>
            <div>Uploaded by:     {{gaiaAsset(token.tokenInfo.assetHash).owner}}</div>
            <div>metaDataUrl:       {{token.tokenInfo.metaDataUrl}}</div>
            <div class="text-info">
              <a class="text-info pr-3 mr-3 border-right" href="#" @click.prevent="transferAsset(token.nftIndex)">transfer</a>
              <a class="text-info pr-3 mr-3 border-right" href="#" @click.prevent="mintNextEdition(token.tokenInfo.assetHash, token.nftIndex)">mint edition {{token.editionCounter}}</a>
              <a class="text-info pr-3 mr-3 border-right" href="#" @click.prevent="confirmBuyNow(token.tokenInfo.assetHash, token.owner)">buy now</a>
              <a class="text-info pr-3 mr-3" href="#" @click.prevent="placeBid(token.tokenInfo.assetHash, token.nftIndex)">place bid</a>
            </div>
          </div>
          <div class="col-2">NFT</div><div class="col-10">#{{token.nftIndex}}</div>
            <div class="col-2">Meta Data Url</div><div class="col-10">{{token.tokenInfo.metaDataUrl}}</div>
          <div class="col-2">Edition</div><div class="col-10">{{token.tokenInfo.edition}} / {{token.tokenInfo.maxEditions}} / {{token.tokenInfo.editionCost}}</div>
          <div class="col-2">SHA(256)</div><div class="col-10">{{token.tokenInfo.assetHash}}</div>
          <div class="col-2">Owner</div><div class="col-10">{{token.owner}}</div>
          <div class="col-2">Sale Data</div><div class="col-10">Type={{token.saleData.saleType}}, Amount={{token.saleData.buyNowOrStartingPrice}} Reserve={{token.saleData.reservePrice}} Increment={{token.saleData.incrementPrice}}</div>
          <div class="col-2">End time</div><div class="col-10">{{formatDate(token.saleData.biddingEndTime)}}</div>
          <div class="col-2">Block-height</div><div class="col-10">{{token.tokenInfo.date}}</div>
          <div class="col-2">Original</div><div class="col-10">{{token.tokenInfo.seriesOriginal}}</div>
          <div class="col-2">Royalties:</div>
          <div class="col-10">
            <div class="row" v-for="(beneficiary, index) in token.beneficiaries" :key="index">
              <div class="col-2">{{beneficiary.username}}</div>
              <div class="col-2">{{beneficiary.royalty}}</div>
              <div class="col-8">{{beneficiary.chainAddress}}</div>
            </div>
          </div>
          <div class="col-2">Bids</div><div class="col-10">{{token.bidCounter}}</div>
            <div class="col-2"></div>
            <div class="col-10">
              <div class="row bg-dark p-2 mr-5" v-for="(bid, index1) in token.bidHistory" :key="index1">
                <div class="col-2">Amount</div><div class="col-10">{{bid.amount}}</div>
                <div class="col-2">Bidder</div><div class="col-10">{{bid.bidder}}</div>
                <div class="col-2">Placed</div><div class="col-10">{{formatDate(bid.whenBid)}}</div>
                <div class="col-2">Cycle</div><div class="col-10">{{bid.saleCycle}}</div>
              </div>
            </div>
          <div class="col-2">Offers</div><div class="col-10">{{token.offerCounter}}</div>
          <div class="col-2"></div>
          <div class="col-10" v-if="token.offerHistory">
            <div v-for="(offer, index1) in token.offerHistory" :key="index1">
              <div>{{offer.amount}}</div>
              <div>{{offer.offerer}}</div>
              <div>{{offer.saleCycle}}</div>
              <div>{{formatDate(offer.madeDate)}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>
</template>

<script>
import moment from 'moment'
import DeployContractFromFile from '@/components/admin/DeployContractFromFile'
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'AppRegistry',
  components: {
    DeployContractFromFile
  },
  data () {
    return {
      project: {
        projectId: process.env.VUE_APP_REGISTRY_CONTRACT_ADDRESS + '.' + process.env.VUE_APP_REGISTRY_CONTRACT_NAME
      },
      deployedProject: null
    }
  },
  methods: {
    gaiaAsset (hash) {
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](hash)
      return gaiaAsset
    },
    formatDate: function (date) {
      const loaclEndM = moment(date)
      return loaclEndM.format('DD-MM-YY')
    },
    valid: function () {
      return this.project.projectId.indexOf('replace') === -1 &&
        this.project.projectId.split('.').length === 2 &&
        this.project.projectId.split('.')[1].length > 2
    },
    deployed: function (data) {
      this.deployedProject = data.project
      this.$root.$emit('bv::show::modal', 'success-modal')
      this.$store.commit('setModalMessage', 'Contract deployment transaction sent to Stacks blockchain - check explorer for progress.')
    },
    useMyAddress: function () {
      const contractAddress = this.$store.getters[APP_CONSTANTS.KEY_PROFILE].stxAddress
      if (!this.project.projectId) {
        this.project.projectId = contractAddress + '.'
      } else if (this.project.projectId.indexOf('.') > -1) {
        const contractName = this.project.projectId.split('.')[1]
        if (contractName) {
          this.project.projectId = contractAddress + '.' + contractName
        }
      } else {
        this.project.projectId = contractAddress + this.project.projectId
      }
    }
  },
  computed: {
    registry () {
      const registry = this.$store.getters[APP_CONSTANTS.KEY_REGISTRY]
      if (!registry) return {}
      return registry
    }
  }
}
</script>
<style lang="scss" scoped>
.upload-preview {
  padding: 10px;
  height: auto;
  border: 0pt dashed rgb(146, 146, 38);
  background-color: #FCFCFC 0% 0% no-repeat padding-box;
  box-shadow: 0px 6px 9px #00000029;
  border-radius: 6px;
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
