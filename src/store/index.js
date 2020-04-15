import Vue from 'vue'
import Vuex from 'vuex'

import { axiosInstance } from 'boot/axios'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    state: {
      user: {
        identity: 'Гость',//previously 'user', or is a mail
        role: 'guest',
        user_id: -1,
        username: '',
        surname: '',
        company: '',
        isagency: false,
        insearch: false,
        cvurl: '',
        ownJobs: [],
        ownCVs: []
      },
      authStatus: 'Вход не выполнен',//previously status in the app - maybe not needed now
      regState: 'login',//текущий таб регистрации
      jobslist: [],
      jobs: {
        jobsFullcount: 0,
        perpage: 25,
        page_current: 1
      },
      uStats: { //user stats - статистика по зп справа на главной
        salMin: "",
        salAvg: "",
        salMax: "",
        tops: [["","",""],["","",""],["","",""],["","",""],["","",""],["","",""]]
      },
      jFilters: {
        query: ''
      },
      jobDetails: {}, //Главный объект JobPage
      cdata: { //Главный объект CompanyPage
        company: '',
        logo_url: '',
        domains: [], //3max
        website: '',
        full_description: '',
        time_created: '',
        jobs_count: 0
      },
    },
    mutations: {
      setRegState (state, value) {
        state.regState = value 
      },
      // setUserMass (state, mass) {
      //   state.user = {...state.user, ...mass}
      // },
      // setUserKeyProp (state, {key, prop}) {
      //   state.user[key] = prop
      //   //console.log({key, prop})
      // },
      refreshJobs (state, rawjobs) {
        state.jobslist = rawjobs.rows
        state.jobsFullcount = Number(rawjobs.full_count)
        state.perpage = Number(rawjobs.perpage)
        state.page_current = Number(rawjobs.page)
      },
      refreshUStats (state, stats) {//user stats
        let salMinTmp = stats.find(stat=>stat.statname == 'salMin')
        state.uStats.salMin = salMinTmp.statvalue + salMinTmp.statcurrency
        let salAvgTmp = stats.find(stat=>stat.statname == 'salAvg')
        state.uStats.salAvg = salAvgTmp.statvalue + salAvgTmp.statcurrency
        let salMaxTmp = stats.find(stat=>stat.statname == 'salMax')
        state.uStats.salMax = salMaxTmp.statvalue + salMaxTmp.statcurrency
        for (let index = 0; index < 6; index++) {
          let tmp = stats.find(stat=>stat.statname == 'top' + (index + 1))
          state.uStats.tops[index] = [
            tmp.statlabel, 
            tmp.statvalue + tmp.statcurrency,
            tmp.statlink
          ]
        }
      },
      setJobDetails (state, job) {
        state.jobDetails = job
      },
      setCompanyDetails (state, company) {
        state.cdata = company
      },
      storeAuth (state, user) {
        state.user = user
        // console.log('cnt', user)
      },
      resetUser (state) {
        state.user = {
          identity: 'Гость',
          role: 'guest',
          user_id: -1,
          username: '',
          surname: '',
          company: '',
          isagency: false,
          insearch: false,
          cvurl: '',
          ownJobs: [],
          ownCVs: []
        }
        state.authStatus = 'Вход не выполнен'
        //should be not just user, but also otehr data user related data
      },
    },
    actions: {
      async refreshjobs (context, {param, param2}) {
        if (this.$router.currentRoute.name == 'jobpage' && param != 'logoclick') {
          //this condition maybe needs repair
          console.log('get one job app level (bluff)')
        } else {
          console.log('refresh ALL jobs app level', param, param2)
          let jobslistUrl = '/jobs.json'
          if (param !== 'init') {
            // console.log('cp55, ', context)
            jobslistUrl += context.state.jFilters.query
            if (param === 'page') {
              jobslistUrl += context.state.jFilters.query.length > 0 ? '&page=' : '?page='
              jobslistUrl += param2
            }
          }
          axiosInstance
            .get(jobslistUrl, null, {headers: {'Content-Type' : 'application/json' }})
            .then(response => {
              // this.$store.dispatch('refreshJobsDataLight', response.data)
              context.commit('refreshJobs', response.data)
            })
          axiosInstance
            .get('/salstats.json', null, {headers: {'Content-Type' : 'application/json' }})
            .then(response => {
              // this.$store.dispatch('refreshUStats', response.data)
              context.commit('refreshUStats', response.data)
            })
        }
      },
      regStateChange (context, value) {
        context.commit('setRegState', value)
      },
      setUserMass (context, mass) {
        // console.log(mass)
        context.commit('setUserMass', mass)
      },
      // setUserKeyProp (context, {key, prop}) {
      //   context.commit('setUserKeyProp', {key, prop})
      // },
      refreshJobsData (context, rawjobs) {
        context.commit('refreshJobs', rawjobs)
        context.commit('refreshUStats', rawjobs.stats)
      },
      refreshJobsDataLight (context, rawjobs) {
        context.commit('refreshJobs', rawjobs)
      },
      refreshUStats (context, stats) {
        context.commit('refreshUStats', stats)
      },
      setJobDetails (context, job) {
        context.commit('setJobDetails', job)
      },
      async fetchJobDetails (context, id) {
        console.log(id)
        let jobUrl = '/jobby.idjson=' + id
        return axiosInstance.get(jobUrl, null, {headers: {'Content-Type' : 'application/json' }})
          .then(({ data }) => {
            context.commit('setJobDetails', data)
          })
      },
      setCompanyDetails (context, company) {
        context.commit('setCompanyDetails', company)
      },
      async fetchCompanyDetails (context, id) {
        console.log(id)
        let jobUrl = '/companyby.idjson=' + id
        return axiosInstance.get(jobUrl, null, {headers: {'Content-Type' : 'application/json' }})
          .then(({ data }) => {
            context.commit('setCompanyDetails', data)
          })
      },
      storeAuth (context, user) {
        // console.log('SA SASDASD')
        context.commit('storeAuth', user)
      },
      async loginGo (context, user) {
        context.commit('storeAuth', user)
        if (user.role == 'subscriber') {
          //this.getOwnCVHits()
        } else if (user.role == 'company') {
          //getOWN JOBS???
        }
      },
      async resetUser (context) {
        //also reset subprofile, etc related data here
        context.commit('resetUser')
      }
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV
  })

  return Store
}
