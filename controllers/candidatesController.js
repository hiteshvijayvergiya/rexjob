// controllers/candidatesController.js - COMPLETE

const db = require('../config/database');
const moment = require('moment');

const candidatesController = {
  
  // List all candidates
  index: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const companyId = req.session.user.companyid;
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      // Get search filter
      const search = req.query.search || '';

      // Build query
      let query = db('tblcandidate as c')
        .select(
          'c.*',
          'city.name as cityname',
          'state.name as statename'
        )
        .leftJoin('tblcity as city', 'c.candidatecity', 'city.id')
        .leftJoin('tblstates as state', 'c.candidatestate', 'state.id')
        .where('c.companyid', companyId)
        .where(function() {
          this.whereNull('c.isdeleted').orWhere('c.isdeleted', false);
        });

      // Apply search
      if (search) {
        query.where(function() {
          this.where('c.candidatename', 'like', `%${search}%`)
            .orWhere('c.candidateemail', 'like', `%${search}%`)
            .orWhere('c.candidatemobile', 'like', `%${search}%`);
        });
      }

      // Get total
      const countQuery = query.clone();
      const totalResult = await countQuery.count('* as total').first();
      const total = totalResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get candidates
      const candidates = await query
        .orderBy('c.addeddate', 'desc')
        .limit(limit)
        .offset(offset);

      res.render('candidates/index', {
        title: 'Candidates',
        candidates,
        search,
        pagination: { page, totalPages, total, limit },
        moment
      });
    } catch (error) {
      console.error('Candidates error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  },

  // View candidate details
  view: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/account/login');
      }

      const candidateId = req.params.id;
      const companyId = req.session.user.companyid;

      const candidate = await db('tblcandidate as c')
        .select(
          'c.*',
          'city.name as cityname',
          'state.name as statename',
          'country.name as countryname'
        )
        .leftJoin('tblcity as city', 'c.candidatecity', 'city.id')
        .leftJoin('tblstates as state', 'c.candidatestate', 'state.id')
        .leftJoin('tblcountries as country', 'c.candidatecountry', 'country.id')
        .where('c.candidateid', candidateId)
        .where('c.companyid', companyId)
        .first();

      if (!candidate) {
        return res.status(404).render('error/404', { title: 'Candidate Not Found' });
      }

      res.render('candidates/view', {
        title: candidate.candidatename,
        candidate,
        moment
      });
    } catch (error) {
      console.error('Candidate view error:', error);
      res.status(500).render('error/500', { title: 'Error', message: error.message });
    }
  }
};

module.exports = candidatesController;
