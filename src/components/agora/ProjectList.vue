<template>
<div>
  <div v-for="(project, index) in projects" :key="index">
    <project-list-item class="mb-2" v-on="$listeners" :contractId="project.contractId"/>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import ProjectListItem from '@/components/agora/ProjectListItem'

export default {
  name: 'SideMenu',
  components: {
    ProjectListItem
  },
  props: ['contractId'],
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {
    projects () {
      const appmap = this.$store.getters[APP_CONSTANTS.KEY_REGISTRY]
      if (appmap) return appmap.applications
      return []
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
