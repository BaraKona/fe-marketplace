<template>
<div v-if="content" id="homepage">
  <div :style="bannerImage" class="bg-secondary pt-5 d-flex align-items-center flex-column">
    <div class="my-auto text-white text-center">
        <prismic-rich-text class="title-container"
          :field="content.header"
        />
        <div class="homepage__buttons--container">
          <button class="button-primary"><router-link class="text-white" to="/marketplace">Explore Our Gallery</router-link></button>
          <button class="button-secondary"><router-link class="text-white" to="/community">Find Out More</router-link></button>
        </div>
    </div>
  </div>
  <!-- Items Section -->
  <div class="container" v-if="content" :key="componentKey">
    <div class="d-flex justify-content-center main-search">
      <search-bar :showPrepend="true" v-on="$listeners"/>
    </div>
    <div class="d-flex justify-content-center homepage__categories">
      <div :class="isActive('discover')"><a href="#" @click.prevent="category = 'discover'">Discover</a></div>
      <div :class="isActive('popular')"><a href="#" @click.prevent="category = 'popular'">Popular</a></div>
      <div :class="isActive('collections')"><a href="#" @click.prevent="category = 'collections'">Collections</a></div>
      <div :class="isActive('artists')"><a href="#" @click.prevent="category = 'artists'">Artists</a></div>
      <div :class="isActive('applications')"><a href="#" @click.prevent="category = 'applications'">Applications</a></div>
    </div>
    <div class="homepage__items-section">
      <result-grid :resultSet="resultSet" :gridClasses="gridClasses" v-if="resultSet && resultSet.length > 0"/>
      <div v-else>No results</div>
    </div>
  </div>
  <div class="d-flex justify-content-center homepage__categories--more-button">
    <button class="button-primary">See more collectibles</button>
  </div>
  <div class="container"><div class="homepage__divider"></div></div>
  <!-- Applications Section -->
  <div class="container d-flex justify-content-lg-between justify-content-center homepage__applications">
    <div class="homepage__applications--whitespace d-lg-block d-none"></div>
    <div>
      <h3>Featured Applications</h3>
    </div>
    <div class="homepage__applications--view-all d-lg-block d-none">
      <a class="text-info">View all applications <b-icon icon="caret-right-fill"/></a>
    </div>
  </div>
  <div class="container my-5" v-if="content">
    <div class="row">
      <div v-for="(item, index1) in block2Items" :key="index1" class="col-md-3 col-6 homepage__applications--item">
        <div class="mb-4">
          <img width="50%" :src="content.block1[index1].b1_image1.url"/>
          <img width="50%" :src="content.block1[index1 + 1].b1_image1.url"/>
          <img width="100%" :src="item.app_image.url"/>
          <div class="text-center" v-html="item.app_text[0].text"></div>
        </div>
      </div>
    </div>
    <!-- Mobile design for "View all applications" link -->
    <div class="d-lg-none d-flex justify-content-end homepage__applications--view-all">
      <a class="text-info">View all applications <b-icon icon="caret-right-fill"/></a>
    </div>
  </div>
<!--
  <div class="container d-flex justify-content-between my-5">
    <div class="text-center no-wrap">&nbsp;</div>
    <div class="text-center no-wrap">
      <h1>Featured Collections</h1>
    </div>
    <div class="text-right no-wrap">
      <a class="text-info">View all collections <b-icon icon="caret-right-fill"/></a>
    </div>
  </div>
  <div class="container my-5" v-if="content">
    <div class="row">
      <div v-for="(item, index2) in block1Items" :key="index2" class="col-md-3 col-sm-6 col-xs-12" >
        <div class="mb-4">
          <img width="50%" :src="content.block1[index2].b1_image1.url"/>
          <img width="50%" :src="content.block1[index2 + 1].b1_image1.url"/>
          <img width="50%" :src="content.block1[index2 + 2].b1_image1.url"/>
          <img width="50%" :src="content.block1[index2 + 3].b1_image1.url"/>
          <div class="text-center" v-html="item.app_text[0].text"></div>
        </div>
      </div>
    </div>
  </div>
-->
<!-- Collections Section -->
<div class="container"><div class="homepage__divider"></div></div>
  <div class="container d-flex justify-content-lg-between justify-content-center mb-5 homepage__collections">
    <div class="homepage__collections--whitespace d-lg-block d-none"></div>
    <div>
      <h3>Featured Collections</h3>
    </div>
    <div class="homepage__collections--view-all d-lg-block d-none">
      <a class="text-info">View all collections <b-icon icon="caret-right-fill"/></a>
    </div>
  </div>
  <div class="container my-5" v-if="content">
    <div class="row">
      <div v-for="(item, index3) in block1Items" :key="index3" class="col-md-3 col-6" >
        <div class="mb-4 homepage__items" v-if="index3 < 4">
          <img width="100%" :src="item.b1_image1.url"/>
          <div class="homepage__items--overlay">
              <div class="homepage__items--description">
                <div class="homepage__items--title">Collection Name</div>
                <div class="homepage__items--by">by <span class="homepage__items--artist">Collector Username</span></div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <!-- Mobile design for "View all collections" link -->
    <div class="d-lg-none d-flex justify-content-end homepage__collections--view-all">
      <a class="text-info">View all collections <b-icon icon="caret-right-fill"/></a>
    </div>
  </div>
  <div class="container"><div class="homepage__divider homepage__divider--categories"></div></div>
  <!-- Categories Section -->
  <section class="homepage__categories-sn">
    <div class="container">
      <h2 class="text-white text-center">Categories</h2>
      <div class="row justify-content-center">
        <div class="homepage__categories-sn--category"><img :src="content.categories[0].category_icon.url" :alt="content.categories[0].category_icon.alt"><div class="homepage__categories-sn--text">Digital Art</div></div>
        <div class="homepage__categories-sn--category"><img :src="content.categories[1].category_icon.url" :alt="content.categories[1].category_icon.alt"><div class="homepage__categories-sn--text">Trading Cards</div></div>
        <div class="homepage__categories-sn--category"><img :src="content.categories[2].category_icon.url" :alt="content.categories[2].category_icon.alt"><div class="homepage__categories-sn--text">Certificates</div></div>
        <div class="homepage__categories-sn--category"><img :src="content.categories[3].category_icon.url" :alt="content.categories[3].category_icon.alt"><div class="homepage__categories-sn--text">Digital Property</div></div>
        <div class="homepage__categories-sn--category"><img :src="content.categories[4].category_icon.url" :alt="content.categories[4].category_icon.alt"><div class="homepage__categories-sn--text">Gaming</div></div>
      </div>
    </div>
  </section>
  <!-- Marketplace Section -->
  <div class="container flex-column align-items-center homepage__marketplace-section">
    <div class="row">
      <div class="col-12 text-center">
        <prismic-rich-text
          :field="content.info"
        />
        <div>
          <button class="button-primary button-primary--alternative-marketplace"><router-link to="/admin-app">How It Works</router-link></button>
          <button class="button-secondary button-secondary--alternative-marketplace"><router-link to="/community">Get Involved</router-link></button>
        </div>
      </div>
    </div>
  </div>
  <!-- trading section with background -->
  <div :style="tradingImage" class="d-flex align-items-center flex-column homepage__trading-banner">
    <div class="my-auto text-white text-center">
        <prismic-rich-text
          :field="content.trading[0].trading_info"
        />
        <div class="homepage__buttons--container">
          <button class="button-primary"><span v-html="content.trading_buttons[0].button1[0].text"></span></button>
          <button class="button-secondary"><span v-html="content.trading_buttons[0].button2[0].text"></span></button>
        </div>
    </div>
  </div>
  <!-- news and blog section -->
  <div class="container homepage__blog-section">
    <h3 class="text-center mb-5">News and Blogs</h3>
    <div class="row">
      <div v-for="(item, index2) in content.blogs" :key="index2" class="col-md-3 col-sm-6 col-xs-12" >
        <div class="mb-5">
          <img width="100%" :src="item.image1.url"/>
          <div class="mt-3" v-html="item.words[0].text"></div>
        </div>
      </div>
    </div>
    <div class="text-center"><button class="button-primary button-primary--alternative-marketplace">Read More</button></div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import SearchBar from '@/components/agora/SearchBar'
import ResultGrid from '@/components/agora/ResultGrid'

export default {
  name: 'Homepage',
  components: {
    ResultGrid,
    SearchBar
  },
  data () {
    return {
      query: null,
      componentKey: 0,
      category: 'discover',
      gridClasses: ['col-md-3', 'col-sm-4', 'col-6']
    }
  },
  mounted () {
    this.loading = false
    this.$store.dispatch('rpaySearchStore/findBySearchTerm')
  },
  methods: {
    isActive (category) {
      if (this.category === category) {
        return 'active'
      }
      return ''
    }
  },
  computed: {
    resultSet () {
      return this.$store.getters[APP_CONSTANTS.KEY_SEARCH_RESULTS]
    },
    bannerImage () {
      const content = this.$store.getters['contentStore/getHomepage']
      if (!content) {
        return
      }
      return {
        'z-index': -1,
        padding: '0 0 0 0',
        height: '465px',
        width: '100%',
        'background-repeat': 'no-repeat',
        'background-image': `url(${content.image.url})`,
        'background-position': 'center center',
        '-webkit-background-size': 'cover',
        '-moz-background-size': 'cover',
        '-o-background-size': 'cover',
        'background-size': 'cover',
        opacity: 1
      }
    },
    tradingImage () {
      const content = this.$store.getters['contentStore/getHomepage']
      if (!content) {
        return
      }
      return {
        'z-index': -1,
        padding: '0 0 0 0',
        height: '378px',
        width: '100%',
        'background-repeat': 'no-repeat',
        'background-image': `url(${content.trading[0].trading_image.url})`,
        'background-position': 'center center',
        '-webkit-background-size': 'cover',
        '-moz-background-size': 'cover',
        '-o-background-size': 'cover',
        'background-size': 'cover',
        opacity: 1
      }
    },
    block2Items () {
      const content = this.$store.getters['contentStore/getHomepage']
      return content.block2
    },
    block1Items () {
      const content = this.$store.getters['contentStore/getHomepage']
      return content.block1
    },
    content () {
      const content = this.$store.getters['contentStore/getHomepage']
      return content
    }
  }
}
</script>
<style lang="scss">
/* $info --> #50B1B5 */
#homepage {

  /* 1ST SECTION STYLE */
  & .title-container h1 {
    margin-bottom: 24px;
  }
  & .title-container h2 {
    margin-bottom: 38px;
  }
  & .homepage__buttons--container .button-primary {
    margin-right: 18px;
  }

  /* MAIN SEARCH BAR */
  & .main-search {
    margin-top: -28.5px;
    z-index: 2;
  }
  & .main-search--border {
    width: 100%;
    max-width: 800px;
  }

  /* MAIN SEARCH BAR -- DROPDOWN MENU
  & .input-group .dropdown-menu {
    width: 177px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    position: absolute;
    top: -7px !important;
    left: 0;
    z-index: 1;
  }
  & .input-group .dropdown-menu .dropdown__whitespace {
    height: 30px;
    border: none;
    background: transparent;
  }
  & .input-group .dropdown-menu .dropdown__filler {
    height: 27px;
    border: none;
    border-left: 1px solid #F5F5F5;
    background: #fff;
  }
  & .input-group .dropdown-menu .dropdown__items {
    padding: 0 0 20px;
    border-top: none;
    border-bottom: 1px solid #F5F5F5;
    border-right: 1px solid #F5F5F5;
    border-left: 1px solid #F5F5F5;
    border-radius: 0 0 26px 26px;
    background: #fff;
    box-shadow: 0px 3px 6px -1px rgba(0, 0, 0, 0.161);
  }
  & .input-group .dropdown-menu.show {
    transform: none !important;
  }
  & .input-group .dropdown-item {
    padding: 0 30px;
  }
  & .input-group li:not(:last-child) .dropdown-item {
    margin-bottom: 15px;
  }
  & .input-group li:first-child .dropdown-item {
    border-top: 1px solid #F5F5F5;
    padding-top: 18px;
  }
  */

  /* MAIN SEARCH BAR -- LOOP ICON */
  & .input-group-append svg {
    font-size: 20px;
    font-weight: bold;
    color: #50B1B5;
    margin-right: 22px;
    margin-left: 1px;
  }

  /* CATEGORIES BUTTONS */
  & .homepage__categories {
    border-bottom: 1px solid #E3E3E3;
    margin: 42px 0;
  }
  & .homepage__categories a {
    font-size: 1.2rem;
    font-weight: 700;
    color: #000;
  }
  & .homepage__categories a {
    margin: 0 20px;
  }
  & .homepage__categories .active a {
    color: #50B1B5;
  }
  & .homepage__categories div {
    padding-bottom: 14.5px;
  }
  & .homepage__categories .active {
    border-bottom: 2px solid #50B1B5;
  }
  & .homepage__categories--more-button {
    margin-top: 38px;
  }

  & .homepage__divider {
    margin: 50px 0;
    border-bottom: 1px solid #E3E3E3;
  }

  /* ITEMS STYLE */
  & .homepage__items {
    position: relative;
    width: 100%;
  }

  & .homepage__items--overlay {
    display: flex;
    align-items: flex-end;
    position: absolute;
    width: 100%;
    height: 100%;
    bottom: 0;
    cursor: pointer;
  }

  & .homepage__items--description {
    width: 100%;
    padding: 11px 18px;
    color: #fff;
    text-shadow: 0px 3px 6px #00000029;
    background: #50B1B5;
    opacity: 0;
    transition: opacity ease 0.3s;
  }

  & .homepage__items--overlay:hover .homepage__items--description {
    opacity: 0.95;
  }

  & .homepage__items--title {
    font-size: 1.4rem;
    font-weight: 400;
  }

  & .homepage__items--amount {
    font-size: 1.2rem;
    font-weight: 600;
    align-self: center;
  }

  & .homepage__items--by {
    font-size: 1rem;
    font-weight: 300;
  }

  & .homepage__items--artist {
    font-size: 1rem;
    font-weight: 700;
  }

  & .homepage__items--price {
    font-size: 0.9rem;
    font-weight: 400;
  }

  & .homepage__items--like-btn {
    position: absolute;
    top: 0;
    right: 0;
    color: #FFFFFF;
    font-size: 1.3rem;
    background-color: #50B1B5;
    padding: 10px 13px;
    border-radius: 50%;
  }

  /* APPLICATION SECTION */
  & .homepage__applications {
    margin-bottom: 42px;
  }

  & .homepage__applications--view-all {
    align-self: center;
    font-size: 1.1rem;
    font-weight: 700;
  }

  & .homepage__applications--whitespace {
    width: 121.45px;
    visibility: hidden;
  }

  & .homepage__applications--item div.text-center div {
    font-size: 1.3rem;
    font-weight: 500;
    margin: 20px 0 8px;
  }

  & .homepage__applications--item p {
    font-size: 1rem;
    font-weight: 300;
    text-align: center;
  }

    & .homepage__applications--item p span {
    font-size: 1rem;
    font-weight: 700;
  }

  /* COLLECTIONS SECTION */
  & .homepage__collections {
    margin-bottom: 42px;
  }

  & .homepage__collections--view-all {
    align-self: center;
    font-size: 1.1rem;
    font-weight: 700;
  }

  & .homepage__collections--whitespace {
    width: 90.29px;
    visibility: hidden;
  }

  /* CATEGORIES SECTION */
  & .homepage__divider--categories {
    margin-bottom: 70px;
  }

  & .homepage__categories-sn {
    background: transparent linear-gradient(180deg, #220E95 0%, #071764 100%);
  }
  & .homepage__categories-sn .container {
    padding-top: 50px;
    padding-bottom: 50px;
  }
  & .homepage__categories-sn h2 {
    margin-bottom: 35px;
  }
  & .homepage__categories-sn--category {
    width: 208px;
    height: 180px;
    background-color: rgba(95, 189, 193, 0.1);
    border-radius: 25px;
    display: flex;
    flex-flow: column;
    justify-content: center;
    align-items: center;
  }
  & .homepage__categories-sn--category {
    margin: 0 10px 12px;
  }
  & .homepage__categories-sn--text {
    font-size: 1.6rem;
    color: #fff;
    margin-top: 20px;
  }

  /* MARKETPLACE SECTION */
  & .homepage__marketplace-section {
    padding-top: 120px;
    padding-bottom: 120px;
  }
  & .homepage__marketplace-section h1 {
    margin-bottom: 24px;
  }
  & .homepage__marketplace-section h2 {
    margin-bottom: 0;
  }
  & .homepage__marketplace-section p {
    text-align: center;
    margin: 30px auto;
    width: 50%;
  }
  & .button-primary--alternative-marketplace {
    width: 141px;
    margin-right: 20px;
  }
  & .button-secondary--alternative-marketplace {
    width: 141px;
    background-color: rgba(80, 177, 181, 0.1);
  }
  & .button-primary--alternative-marketplace a {
    color: #fff;
  }
  & .button-secondary--alternative-marketplace a {
    color: #50B1B5;
  }

  /* TRADING SECTION */
  & .homepage__trading-banner h1 {
    margin-bottom: 24px;
  }
  & .homepage__trading-banner .homepage__buttons--container .button-primary {
    margin-right: 20px;
    margin-top: 22px;
  }

  /* BLOG SECTION */
  & .homepage__blog-section {
    padding-top: 120px;
    padding-bottom: 120px;
  }
  & .homepage__blog-section p {
    font-size: 1.7rem;
    font-weight: 500;
  }

}

/* MOBILE DESIGN */
@media only screen and (max-width: 499px) {
  #homepage {

  /* CATEGORIES SECTION */
  & .homepage__categories a {
    font-size: 1rem;
    margin: 0 10px;
  }

  /* MARKETPLACE SECTION */
  & .homepage__marketplace-section p {
    width: 100%;
  }
  & .homepage__marketplace-section button {
    width: 122px;
  }

  /* BUTTONS ON 1ST SECTION AND TRADING BANNER */
  & .homepage__buttons--container {
    display: flex;
    flex-flow: column;
    align-items: center;
  }
  & .homepage__buttons--container .button-primary, .homepage__trading-banner .homepage__buttons--container .button-primary {
    width: 156px;
    margin-bottom: 14px;
    margin-right: 0;
  }
  & .homepage__buttons--container .button-secondary {
    width: 126px;
  }

  /* BLOG SECTION */
  & .homepage__blog-section {
    width: 80%;
  }

  }
}

/* CATEGORIES SECTION */
@media only screen and (max-width: 359px) {
  #homepage .homepage__categories a {
    font-size: 1rem;
    margin: 0 7px;
  }
}
</style>
