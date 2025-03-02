<template>
<div>
  <div class="mb-4">
    <div class="d-flex justify-content-between">
      <div>
        <a href="#" @click.prevent="showDomainForm = !showDomainForm">New Domain</a>
      </div>
      <div v-if="showClear">
        Clear:
        <a class="mx-2" href="#" @click.prevent="clearAssets">assets</a>
        <a class="mx-2" href="#" @click.prevent="clearUsers">users</a>
      </div>
    </div>
    <div class="d-flex justify-content-start">
      <div>
        Index:
        <a class="mx-2" href="#" @click.prevent="indexUsers(users)">all me</a>
        <a class="mx-2" href="#" @click.prevent="indexUsers(usersMin)">radicle_art</a>
      </div>
    </div>
  </div>
  <domain-index-form v-if="showDomainForm" />
  <div class="p-4" v-else>
    <b-table striped hover
      :items="values()"
      :fields="fields()"
      :sort-by.sync="sortBy"
    >
      <template #cell(assetUrl)="data">
        <span v-html="data.value"></span>
      </template>
      <template #cell(zonefile)="data">
        <span v-html="data.value"></span>
      </template>
    </b-table>
    <div v-if="searchResults">{{searchResults[0]}}</div>
  </div>
</div>
</template>

<script>
import moment from 'moment'
import DomainIndexForm from './DomainIndexForm'

export default {
  name: 'IndexSettings',
  components: {
    DomainIndexForm
  },
  data () {
    return {
      showClear: true,
      projectOption: 0,
      showDomainForm: false,
      searchResults: null,
      result: null,
      searchType: null,
      users: 'brightblock.id,mikecohen.id,mijoco.id.blockstack,madeleine.id.blockstack,feekster.id.blockstack,yakahead.id.blockstack,figis.id.blockstack,radicle_art.id.blockstack,mike.personal.id,rosemarry.id.blockstack,antoniomeic.id.blockstack',
      usersMin: 'radicle_art.id.blockstack',
      sortBy: 'updated'
    }
  },
  methods: {
    fields () {
      if (this.searchType === 'users') {
        return ['name', 'zonefile', 'app count']
      } else if (this.searchType === 'projects') {
        return ['id', 'owner', 'updated', 'title', 'assetUrl']
      } else {
        return ['owner', 'updated', 'title', 'assetUrl', 'projectId']
      }
    },
    values () {
      if (!this.searchResults) return
      let mapped = []
      if (this.searchType === 'users') {
        const $self = this
        mapped = this.searchResults.map(function (a) { return { name: a.name, 'app count': $self.countApps(a.apps), zonefile: '<a href="' + $self.parseProfile(a.zonefile) + '">profile</a>' } })
      } else if (this.searchType === 'projects') {
        mapped = this.searchResults.map(function (a) { return { id: a.projectId, owner: a.owner, updated: moment(a.updated).format('YYYY-MM-DD HH:mm:SS'), title: a.title, type: a.objType, assetUrl: '<img width="50px" height="50px" src="' + a.assetUrl + '"/>' } })
      } else {
        mapped = this.searchResults.map(function (a) { return { owner: a.owner, updated: moment(a.updated).format('YYYY-MM-DD HH:mm:SS'), title: a.title, assetUrl: (a.assetProjectUrl) ? '<a href="' + a.assetProjectUrl + '" target="_blank"><img width="50px" height="50px" src="' + a.assetUrl + '"/></a>' : '', projectId: a.projectId } })
      }
      return mapped
    },
    countApps (apps) {
      if (apps) {
        try {
          return apps.split('http').length
        } catch (error) {
          return 0
        }
      }
      return 0
    },
    parseProfile (zonefile) {
      if (zonefile.indexOf('"http') > -1) {
        try {
          const parts = zonefile.split('"')
          let found
          parts.forEach(function (part) {
            if (part.startsWith('http')) {
              if (part.endsWith('json')) {
                found = part.split('.json')[0] + '.json'
              } else if (part.endsWith('id')) {
                found = part.split('.id')[0] + '.id'
              }
            }
          })
          return found
        } catch (error) {
          return 'error'
        }
      }
    },
    findUsers () {
      this.$store.dispatch('rpaySearchStore/findUsers').then((results) => {
        this.searchResults = results
        this.searchType = 'users'
      })
    },
    findAssets () {
      this.$store.dispatch('rpaySearchStore/findAssets').then((results) => {
        this.searchResults = results
        this.searchType = 'assets'
      })
    },
    indexUsers (users) {
      this.$store.dispatch('rpaySearchStore/indexUsers', users).then((result) => {
        this.result = result
      })
    },
    clearUsers () {
      this.$store.dispatch('rpaySearchStore/clearUsers').then(() => {
        this.$notify({ type: 'info', title: 'Index Details', text: 'Cleared the user lucene index' })
      })
    },
    clearAssets () {
      this.$store.dispatch('rpaySearchStore/clearAssets').then(() => {
        this.$notify({ type: 'info', title: 'Index Details', text: 'Cleared the assets lucene index' })
      })
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>
