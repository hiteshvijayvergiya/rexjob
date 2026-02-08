/**
 * Migration: 005_create_applications_candidates_tables.js
 * Creates: tblapplyjob, tblcandidate
 */

exports.up = function(knex) {
  return knex.schema
    // 1. Apply Job (Job Applications)
    .createTable('tblapplyjob', (table) => {
      table.increments('applyjobid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('applyjobname', 50).comment('Applicant name');
      table.string('applyjobaddress', 500);
      table.string('applyjobmobile', 50);
      table.string('applyjobemail', 50);
      table.integer('requirementid').unsigned().comment('Which job');
      table.string('applyjobresume', 500).comment('Resume S3 path');
      table.integer('totalexperienceyear').comment('Experience years');
      table.integer('totalexperiencemonth').comment('Experience months');
      table.decimal('currentsalray', 18, 2).comment('Current salary');
      table.decimal('expectedsalary', 18, 2).comment('Expected salary');
      table.integer('noticeperiod').comment('Notice period in days');
      table.string('reasonjobchange', 50).comment('Reason for change');
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.boolean('isshortlisted').defaultTo(false).comment('HR shortlist flag');
      table.boolean('isdeleted').defaultTo(false);
      table.integer('companyid').unsigned();
      table.integer('countrycode');
        table.string('currentlocation', 100).comment('Current city/location');
        table.integer('expyear').comment('Experience years (legacy)');
        table.integer('expmonth').comment('Experience months (legacy)');
        table.decimal('currentsalary', 18, 2).comment('Current salary (correct)');
        table.boolean('isactive').defaultTo(true).comment('Active application');
      
      // Unique constraint - prevent duplicate applications
      table.unique(['applyjobemail', 'requirementid', 'isdeleted'], 'uk_email_requirement');
      
      // Performance Indexes
      table.index(['requirementid', 'isdeleted', 'addeddate'], 'idx_requirement');
      table.index('applyjobemail', 'idx_apply_email');
      table.index(['companyid', 'addeddate', 'isdeleted'], 'idx_company_date');
      table.index(['isshortlisted', 'requirementid'], 'idx_shortlisted');
      table.index(['addeddate', 'companyid', 'isdeleted'], 'idx_date_range');
      
      // Composite index for application analytics
      table.index([
        'companyid', 'isdeleted', 'addeddate', 
        'isshortlisted', 'requirementid'
      ], 'idx_application_analytics');
      
      // Foreign Keys
      table.foreign('requirementid').references('requirementid').inTable('tblrequirement').onDelete('CASCADE');
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 2. Candidate (Candidate Pool/Database)
    .createTable('tblcandidate', (table) => {
      table.bigIncrements('candidateid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('candidatename', 100);
      table.integer('candidatecity');
      table.string('candidateemail', 50);
      table.string('candidatemobile', 50);
      table.integer('requirementtypeid').unsigned().comment('Job category interest');
      table.integer('requirementpositionid').unsigned().comment('Technology/skill');
      table.string('candidatejobdesciption', 500);
      table.string('candidateresume', 500).comment('Resume path');
      table.integer('socialtype').comment('Social media source');
      table.string('referencename', 50);
      table.string('referenceno', 50);
      table.string('referenceemail', 50);
      table.string('referencecity', 50);
      table.tinyint('gender').comment('1=Male, 2=Female, 3=Other');
      table.integer('age');
      table.integer('candidatestate');
      table.integer('candidatecountry');
      table.integer('companyid').unsigned();
      table.integer('countrycode');
      table.datetime('addeddate');
      table.integer('addedby');
      table.datetime('updateddate');
      table.integer('updatedby');
      table.datetime('deleteddate');
      table.integer('deletedby');
      table.boolean('isdeleted').defaultTo(false);
      table.boolean('isapply').defaultTo(false).comment('Applied for job?');
      table.integer('experienceinmonth').comment('Total experience in months');
      table.integer('noticeperiod');
      table.decimal('currentsalary', 18, 2);
      table.decimal('expectedsalary', 18, 2);
      table.integer('maritalstatus').comment('1=Single, 2=Married, 3=Other');
      table.string('reasonjobchange', 500);
      table.string('currentcompanyname', 500);
      table.string('applyfor', 500);
      table.string('fromname', 50).comment('Referral source');
      table.text('preferredlocation');
      table.boolean('isreadytorelocate').defaultTo(false);
        table.integer('candidateexp').comment('Experience in years (legacy insert support)');
        table.string('candidatequalification', 150);
        table.decimal('candidatecurrentctc', 18, 2);
        table.decimal('candidateexpectedctc', 18, 2);
        table.boolean('isactive').defaultTo(true);
      // Performance Indexes
      table.index(['requirementtypeid', 'requirementpositionid', 'isdeleted'], 'idx_skills');
      table.index(['candidatecity', 'candidatestate', 'isdeleted'], 'idx_location');
      table.index('candidateemail', 'idx_cand_email');
      table.index(['companyid', 'addeddate', 'isdeleted'], 'idx_company_date');
      table.index(['experienceinmonth', 'isdeleted'], 'idx_experience');
      table.index(['fromname', 'addeddate'], 'idx_source');
      table.index(['expectedsalary', 'isdeleted'], 'idx_salary');
      
      // Composite index for candidate search
      table.index([
        'isdeleted', 'requirementtypeid', 
        'requirementpositionid', 'experienceinmonth', 
        'expectedsalary'
      ], 'idx_candidate_search');
      
      // Foreign Keys
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
      table.foreign('requirementtypeid').references('requirementtypeid').inTable('tblrequirementtype').onDelete('SET NULL');
      table.foreign('requirementpositionid').references('requirementpositionid').inTable('tblrequirementposition').onDelete('SET NULL');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tblcandidate')
    .dropTableIfExists('tblapplyjob');
};
