/**
 * Migration: Full RexJobs Schema — MySQL compatible
 * All booleans as tinyint(1), timestamps as datetime, no .returning()
 */

exports.up = function(knex) {
  return knex.schema

    .createTable('tblcompany', t => {
      t.increments('companyid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('companyname', 100);
      t.string('companyemail', 100);
      t.string('companymobile', 50);
      t.string('companywebsite', 100);
      t.string('companylogo', 500);
      t.tinyint('isadmincompany').defaultTo(0);
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.integer('addedby').unsigned().nullable();
      t.datetime('updateddate').nullable();
      t.integer('updatedby').unsigned().nullable();
      t.tinyint('isactive').defaultTo(1);
      t.tinyint('isdeleted').defaultTo(0);
    })

    .createTable('tblusertype', t => {
      t.increments('usertypeid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('usertypename', 50);
      t.integer('companyid').unsigned().nullable();
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.tinyint('isactive').defaultTo(1);
      t.tinyint('isdeleted').defaultTo(0);
    })

    .createTable('tbluser', t => {
      t.increments('userid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('username', 50).nullable();
      t.string('userpassword', 255);
      t.string('fname', 50).nullable();
      t.string('lname', 50).nullable();
      t.string('useremail', 100).notNullable();
      t.string('mobile', 50).nullable();
      t.tinyint('isadmin').defaultTo(0);
      t.tinyint('issuperadmin').defaultTo(0);
      t.tinyint('isactive').defaultTo(1);
      t.tinyint('islogin').defaultTo(0);
      t.datetime('logindate').nullable();
      t.datetime('logoutdate').nullable();
      t.tinyint('issignup').defaultTo(0);
      t.datetime('signupdate').nullable();
      t.integer('usertypeid').unsigned().nullable();
      t.integer('companyid').unsigned().nullable();
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.integer('addedby').unsigned().nullable();
      t.datetime('updateddate').nullable();
      t.integer('updatedby').unsigned().nullable();
      t.datetime('deleteddate').nullable();
      t.integer('deletedby').unsigned().nullable();
      t.tinyint('isdeleted').defaultTo(0);
      t.index(['useremail'], 'idx_user_email');
      t.index(['companyid','isactive','isdeleted'], 'idx_user_company');
    })

    .createTable('tblforgotpassword', t => {
      t.bigIncrements('forgotpasswordid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('userid').unsigned().nullable();
      t.string('token', 500);
      t.datetime('expirydate').nullable();
      t.tinyint('isused').defaultTo(0);
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.datetime('useddate').nullable();
      t.index('token', 'idx_forgot_token');
    })

    .createTable('tblcountries', t => {
      t.increments('id').primary();
      t.string('sortname', 3).nullable();
      t.string('name', 150);
      t.integer('phonecode').nullable();
    })

    .createTable('tblstates', t => {
      t.increments('id').primary();
      t.string('name', 100);
      t.integer('country_id').unsigned().nullable();
    })

    .createTable('tblcity', t => {
      t.increments('id').primary();
      t.string('name', 100);
      t.integer('state_id').unsigned().nullable();
    })

    .createTable('tbljobcategory', t => {
      t.increments('categoryid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.string('categoryname', 200).notNullable();
      t.string('categoryseoname', 200).nullable();
      t.text('categorydescription').nullable();
      t.string('categoryimage', 500).nullable();
      t.integer('parent_id').unsigned().nullable();
      t.integer('sort_order').defaultTo(0);
      t.integer('depth').defaultTo(0);
      t.string('path', 1000).nullable();
      t.integer('companyid').unsigned().nullable();
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.integer('addedby').unsigned().nullable();
      t.datetime('updateddate').nullable();
      t.integer('updatedby').unsigned().nullable();
      t.datetime('deleteddate').nullable();
      t.integer('deletedby').unsigned().nullable();
      t.tinyint('isactive').defaultTo(1);
      t.tinyint('isdeleted').defaultTo(0);
      t.index(['parent_id','isactive','isdeleted'], 'idx_cat_parent');
      t.index(['companyid','isactive','isdeleted'], 'idx_cat_company');
    })

    .createTable('tbljobpost', t => {
      t.increments('jobid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('companyid').unsigned().nullable();
      t.integer('postedby').unsigned().nullable();
      t.integer('categoryid').unsigned().nullable();
      t.string('jobtitle', 200).notNullable();
      t.string('jobseoname', 250).nullable();
      t.text('jobdescription').nullable();
      t.text('jobskills').nullable();
      t.text('jobresponsibility').nullable();
      t.text('jobeducation').nullable();
      t.text('jobdocument').nullable();
      t.integer('jobtype').defaultTo(1);
      t.integer('jobcity').nullable();
      t.decimal('expstart', 12, 2).nullable();
      t.decimal('expend', 12, 2).nullable();
      t.decimal('salarystart', 18, 2).nullable();
      t.decimal('salaryend', 18, 2).nullable();
      t.integer('noofopenings').defaultTo(1);
      // approvalstatus: 0=Pending, 1=Approved, 2=Rejected
      t.integer('approvalstatus').defaultTo(0);
      t.integer('approvedby').unsigned().nullable();
      t.datetime('approveddate').nullable();
      t.text('rejectionreason').nullable();
      t.tinyint('isactive').defaultTo(0);
      t.tinyint('isdeleted').defaultTo(0);
      t.datetime('jobstart').nullable();
      t.datetime('jobend').nullable();
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.integer('addedby').unsigned().nullable();
      t.datetime('updateddate').nullable();
      t.integer('updatedby').unsigned().nullable();
      t.datetime('deleteddate').nullable();
      t.integer('deletedby').unsigned().nullable();
      t.index(['companyid','isactive','isdeleted'], 'idx_job_company');
      t.index(['categoryid','isactive','isdeleted'], 'idx_job_category');
      t.index(['approvalstatus','isdeleted'], 'idx_job_approval');
    })

    .createTable('tbljobapplication', t => {
      t.increments('applicationid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('jobid').unsigned().nullable();
      t.integer('candidateuserid').unsigned().nullable();
      t.string('fullname', 150).notNullable();
      t.string('email', 100).notNullable();
      t.string('mobile', 50).nullable();
      t.string('currentlocation', 100).nullable();
      t.string('resumepath', 500).nullable();
      t.integer('expyear').defaultTo(0);
      t.integer('expmonth').defaultTo(0);
      t.decimal('currentsalary', 18, 2).nullable();
      t.decimal('expectedsalary', 18, 2).nullable();
      t.integer('noticeperiod').defaultTo(0);
      t.string('reasonforchange', 500).nullable();
      t.text('skills').nullable();
      t.string('qualification', 200).nullable();
      t.text('coverletter').nullable();
      // status: 0=New 1=Shortlisted 2=Interview 3=Offered 4=Rejected 5=Withdrawn
      t.integer('status').defaultTo(0);
      t.tinyint('isshortlisted').defaultTo(0);
      t.integer('companyid').unsigned().nullable();
      t.tinyint('isdeleted').defaultTo(0);
      t.tinyint('isactive').defaultTo(1);
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.integer('addedby').unsigned().nullable();
      t.datetime('updateddate').nullable();
      t.integer('updatedby').unsigned().nullable();
      t.index(['jobid','isdeleted'], 'idx_app_job');
      t.index(['companyid','isdeleted'], 'idx_app_company');
      t.index(['candidateuserid','isdeleted'], 'idx_app_user');
    })

    .createTable('tblcandidate', t => {
      t.increments('candidateid').primary();
      t.string('uuid', 36).notNullable().unique();
      t.integer('userid').unsigned().nullable();
      t.string('candidatename', 150).nullable();
      t.string('candidateemail', 100).nullable();
      t.string('candidatemobile', 50).nullable();
      t.string('resumepath', 500).nullable();
      t.text('skills').nullable();
      t.string('qualification', 200).nullable();
      t.integer('expyear').defaultTo(0);
      t.integer('expmonth').defaultTo(0);
      t.decimal('currentsalary', 18, 2).nullable();
      t.decimal('expectedsalary', 18, 2).nullable();
      t.integer('noticeperiod').defaultTo(0);
      t.integer('companyid').unsigned().nullable();
      t.tinyint('isactive').defaultTo(1);
      t.tinyint('isdeleted').defaultTo(0);
      t.datetime('addeddate').defaultTo(knex.fn.now());
      t.integer('addedby').unsigned().nullable();
      t.datetime('updateddate').nullable();
      t.integer('updatedby').unsigned().nullable();
      t.index('candidateemail', 'idx_cand_email');
      t.index(['companyid','isdeleted'], 'idx_cand_company');
    })

    .createTable('ActivityLog', t => {
      t.bigIncrements('ActivityId').primary();
      t.text('ActivityLog').nullable();
      t.integer('MenuId').nullable();
      t.bigInteger('UserId').nullable();
      t.bigInteger('RecordId').nullable();
      t.datetime('CreatedDate').defaultTo(knex.fn.now());
      t.integer('companyid').nullable();
    })

    .createTable('ErrorLog', t => {
      t.bigIncrements('ErrorId').primary();
      t.string('uuid', 36).nullable();
      t.text('ErrorMsg').nullable();
      t.text('InnerException').nullable();
      t.string('IpAddress', 50).nullable();
      t.bigInteger('UserId').nullable();
      t.datetime('CreatedDate').defaultTo(knex.fn.now());
      t.string('Controller', 255).nullable();
      t.string('Action', 255).nullable();
      t.integer('companyid').nullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ErrorLog')
    .dropTableIfExists('ActivityLog')
    .dropTableIfExists('tblcandidate')
    .dropTableIfExists('tbljobapplication')
    .dropTableIfExists('tbljobpost')
    .dropTableIfExists('tbljobcategory')
    .dropTableIfExists('tblcity')
    .dropTableIfExists('tblstates')
    .dropTableIfExists('tblcountries')
    .dropTableIfExists('tblforgotpassword')
    .dropTableIfExists('tbluser')
    .dropTableIfExists('tblusertype')
    .dropTableIfExists('tblcompany');
};
