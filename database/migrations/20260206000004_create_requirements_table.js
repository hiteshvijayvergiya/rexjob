/**
 * Migration: 004_create_requirements_table.js
 * Creates: tblrequirement (Main Job Postings Table)
 */

exports.up = function(knex) {
  return knex.schema
    .createTable('tblrequirement', (table) => {
      table.increments('requirementid').primary();
      table.uuid('uuid').notNullable().unique();
      table.integer('companyid').unsigned();
      table.integer('clientid').unsigned();
      table.integer('requirementtypeid').unsigned().comment('Job category');

      table.integer('requirementpositionid').unsigned().comment('Technology/skill');
      table.string('requirementname', 50).comment('Job title');
      table.text('requirementdescription').comment('Job description');
      table.integer('requirementexptypeid').comment('Experience type');
      table.decimal('expstart', 12, 2).comment('Min experience (years)');
      table.decimal('expend', 12, 2).comment('Max experience (years)');
      table.integer('requirementsalarytype').comment('Salary type (hourly/monthly/yearly)');
      table.integer('requirementcurrency').comment('Currency code');
      table.decimal('salarystart', 18, 2).comment('Min salary');
      table.decimal('salaryend', 18, 2).comment('Max salary');
      table.boolean('isactive').defaultTo(true).comment('Published/visible');
      table.boolean('isdeleted').defaultTo(false);
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.string('requirementimage', 500).comment('Job image/logo');
      table.string('requirementdoc', 500).comment('Attachment');
      table.integer('requirementpriorityid').unsigned();
      table.datetime('requirementstart').comment('Job start date');
      table.datetime('requirementend').comment('Application deadline');
      table.integer('jobtype').comment('1=Full-time, 2=Part-time, 3=Contract, 4=Internship');
      table.integer('requirementcountry');
      table.integer('requirementstate');
      table.integer('requirementcity');
      table.string('requirementarea', 500).comment('Specific location');
      table.decimal('requirementpercentage', 12, 2);
      table.integer('requirementsalarykey');
      table.integer('noofrequirement').comment('Number of openings');
        table.string('requirementseoname', 150).comment('SEO friendly job url');
        table.text('requirementskill').comment('Required skills');
        table.text('requirementresponsibility').comment('Job responsibilities');
        table.text('requirementeducation').comment('Education requirement');
        table.text('requirementdocument').comment('Required documents');
      
      // Performance Indexes
      table.index(['isactive', 'isdeleted', 'companyid', 'addeddate'], 'idx_active_jobs');
      table.index(['requirementtypeid', 'isactive', 'isdeleted'], 'idx_category');
      table.index(['requirementpositionid', 'isactive', 'isdeleted'], 'idx_technology');
      table.index(['requirementcity', 'isactive', 'isdeleted'], 'idx_location');
      table.index(['jobtype', 'isactive', 'isdeleted'], 'idx_jobtype');
      table.index('requirementpriorityid', 'idx_req_priority');
      table.index(['requirementend', 'isactive'], 'idx_deadline');
      table.index(['companyid', 'isactive', 'isdeleted', 'addeddate'], 'idx_company_active');
      
      // Composite index for job search
      table.index([
        'isactive', 'isdeleted', 'companyid', 
        'requirementtypeid', 'requirementpositionid', 
        'requirementcity', 'addeddate'
      ], 'idx_job_search');
      
      // Foreign Keys
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
      table.foreign('clientid').references('clientid').inTable('tblclient').onDelete('SET NULL');
      table.foreign('requirementtypeid').references('requirementtypeid').inTable('tblrequirementtype').onDelete('SET NULL');
      table.foreign('requirementpositionid').references('requirementpositionid').inTable('tblrequirementposition').onDelete('SET NULL');
      table.foreign('requirementpriorityid').references('requirementpriorityid').inTable('tblrequirementpriority').onDelete('SET NULL');
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tblrequirement');
};
