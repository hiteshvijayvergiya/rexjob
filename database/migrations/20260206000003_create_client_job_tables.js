/**
 * Migration: 003_create_client_job_tables.js
 * Creates: ClientType, Client, ClientDocument, RequirementPriority, RequirementType, RequirementPosition
 */

exports.up = function(knex) {
  return knex.schema
    // 1. Client Type
    .createTable('tblclienttype', (table) => {
      table.increments('clienttypeid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('clienttypename', 50);
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.boolean('isactive').defaultTo(true);
      table.boolean('isdeleted').defaultTo(false);
      table.integer('companyid').unsigned();
      
      // Indexes
      table.index(['companyid', 'isactive', 'isdeleted']);
      
      // Foreign Key
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 2. Client
    .createTable('tblclient', (table) => {
      table.increments('clientid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('clientname', 100);
      table.string('clientaddress', 500);
      table.string('clientmobile', 50);
      table.string('clientemail', 50);
      table.integer('clientcountryid');
      table.integer('clientstateid');
      table.integer('clientcityid');
      table.integer('clienttypeid').unsigned();
      table.string('clientwebsite', 100);
      table.string('clientgst', 50);
      table.string('clientpan', 50);
      table.integer('companyid').unsigned();
      table.datetime('addeddate');
      table.integer('addedby');
      table.datetime('updateddate');
      table.integer('updatedby');
      table.datetime('deleteddate');
      table.integer('deletedby');
      table.boolean('isactive').defaultTo(true);
      table.boolean('isdeleted').defaultTo(false);
      table.integer('countrycode');
      
      // Indexes
      table.index(['companyid', 'isactive', 'isdeleted']);
      table.index('clientemail', 'idx_client_email');
      table.index(['clientcountryid', 'clientstateid', 'clientcityid']);
      table.index('clienttypeid', 'idx_client_type');
      
      // Foreign Keys
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
      table.foreign('clienttypeid').references('clienttypeid').inTable('tblclienttype').onDelete('SET NULL');
    })
    
    // 3. Client Document
    .createTable('tblclientdocument', (table) => {
      table.increments('clientdocumentid').primary();
      table.uuid('uuid').notNullable().unique();
      table.integer('clientid').unsigned();
      table.string('documentname', 100);
      table.string('documentpath', 500);
      table.string('documenttype', 50);
      table.datetime('addeddate');
      table.integer('addedby');
      table.datetime('updateddate');
      table.integer('updatedby');
      table.datetime('deleteddate');
      table.integer('deletedby');
      table.boolean('isdeleted').defaultTo(false);
      table.integer('companyid').unsigned();
      
      // Indexes
      table.index(['clientid', 'isdeleted']);
      table.index('companyid', 'idx_clientdoc_company');
      
      // Foreign Key
      table.foreign('clientid').references('clientid').inTable('tblclient').onDelete('CASCADE');
    })
    
    // 4. Requirement Priority
    .createTable('tblrequirementpriority', (table) => {
      table.increments('requirementpriorityid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('requirementpriorityname', 50);
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.boolean('isactive').defaultTo(true);
      table.boolean('isdeleted').defaultTo(false);
      table.integer('companyid').unsigned();
      
      // Indexes
      table.index(['companyid', 'isactive', 'isdeleted']);
      
      // Foreign Key
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 5. Requirement Type (Job Categories)
    .createTable('tblrequirementtype', (table) => {
      table.increments('requirementtypeid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('requirementtypename', 50);
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.boolean('isactive').defaultTo(true);
      table.boolean('isdeleted').defaultTo(false);
      table.integer('companyid').unsigned();
      // SEO Fields
      table.text('SeoJobTitle');
      table.text('SeoJobKeyword');
      table.text('SeoJobDescription');
      table.text('SeoOgTitle');
      table.text('OgDescriptionSeo');
      
      // Indexes
      table.index(['companyid', 'isactive', 'isdeleted']);
      table.index('requirementtypename', 'idx_reqtype_name');
      
      // Foreign Key
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
    })
    
    // 6. Requirement Position (Technologies)
    .createTable('tblrequirementposition', (table) => {
      table.increments('requirementpositionid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('requirementpositionname', 50);
      table.integer('requirementtypeid').unsigned();
      table.boolean('isactive').defaultTo(true);
      table.boolean('isdeleted').defaultTo(false);
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.integer('companyid').unsigned();
      
      // Indexes
      table.index(['companyid', 'isactive', 'isdeleted'], 'idx_reqpos_company');
      table.index(['requirementtypeid', 'isactive', 'isdeleted'], 'idx_reqpos_type');
      table.index('requirementpositionname', 'idx_reqpos_name');
      
      // Foreign Keys
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
      table.foreign('requirementtypeid').references('requirementtypeid').inTable('tblrequirementtype').onDelete('SET NULL');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tblrequirementposition')
    .dropTableIfExists('tblrequirementtype')
    .dropTableIfExists('tblrequirementpriority')
    .dropTableIfExists('tblclientdocument')
    .dropTableIfExists('tblclient')
    .dropTableIfExists('tblclienttype');
};
