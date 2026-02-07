/**
 * Migration: 002_create_master_data_tables.js
 * Creates: Countries, States, Cities, Users
 */

exports.up = function(knex) {
  return knex.schema
    // 1. Countries
    .createTable('tblcountries', (table) => {
      table.increments('id').primary();
      table.string('sortname', 3);
      table.string('name', 150);
      table.integer('phonecode');
      
      // Indexes
      table.index('sortname', 'idx_country_code');
      table.index('name', 'idx_country_name');
    })
    
    // 2. States
    .createTable('tblstates', (table) => {
      table.increments('id').primary();
      table.string('name', 30);
      table.integer('country_id').unsigned();
      
      // Indexes
      table.index('country_id', 'idx_state_country');
      table.index('name', 'idx_country_name');
      
      // Foreign Key
      table.foreign('country_id').references('id').inTable('tblcountries').onDelete('CASCADE');
    })
    
    // 3. Cities
    .createTable('tblcity', (table) => {
      table.increments('id').primary();
      table.string('name', 30);
      table.integer('state_id').unsigned();
      
      // Indexes
      table.index('state_id', 'idx_city_state');
      table.index('name', 'idx_country_name');
      
      // Foreign Key
      table.foreign('state_id').references('id').inTable('tblstates').onDelete('CASCADE');
    })
    // 5. User Type
      .createTable('tblusertype', (table) => {
          table.increments('usertypeid').primary();
          table.uuid('uuid').notNullable().unique();
          table.string('usertypename', 50);
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
          table.index(['companyid', 'isactive', 'isdeleted'], 'idx_usertype_company');

          // Foreign Key
          table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
      })
    
    // 4. Users
    .createTable('tbluser', (table) => {
      table.increments('userid').primary();
      table.uuid('uuid').notNullable().unique();
      table.string('username', 50);
      table.string('userpassword', 255); // bcrypt hash
      table.string('fname', 50);
      table.string('mname', 50);
      table.string('lname', 50);
      table.string('useremail', 50);
      table.boolean('isadmin').defaultTo(false);
      table.boolean('issuperadmin').defaultTo(false);
      table.boolean('isactive').defaultTo(true);
      table.integer('usertypeid').unsigned();
      table.integer('companyid').unsigned();
      table.text('userimage');
      table.string('mobile', 50);
      table.string('address', 500);
      table.tinyint('gendar').comment('1=Male, 2=Female, 3=Other');
      table.integer('age');
      table.integer('countryid');
      table.integer('stateid');
      table.integer('cityid');
      table.boolean('islogin').defaultTo(false);
      table.datetime('logindate');
      table.datetime('logoutdate');
      table.boolean('isrememberme').defaultTo(false);
      table.boolean('issignup').defaultTo(false);
      table.datetime('signupdate');
      table.boolean('isapprovedsignup').defaultTo(false);
      table.integer('countrycode');
      table.datetime('addeddate');
      table.datetime('updateddate');
      table.datetime('deleteddate');
      table.integer('addedby');
      table.integer('updatedby');
      table.integer('deletedby');
      table.boolean('isdeleted').defaultTo(false);
      
      // Unique constraints
      table.unique(['useremail', 'isdeleted']);
      table.unique(['username', 'isdeleted']);
      
      // Indexes
      table.index(['companyid', 'isactive', 'isdeleted']);
      table.index('usertypeid', 'idx_user_type');
      table.index(['useremail', 'userpassword', 'isactive']);
      
      // Foreign Keys
      table.foreign('companyid').references('companyid').inTable('tblcompany').onDelete('CASCADE');
      table.foreign('usertypeid').references('usertypeid').inTable('tblusertype').onDelete('SET NULL');
    })
    
    // 5. Forgot Password
    .createTable('tblforgotpassword', (table) => {
      table.bigIncrements('forgotpasswordid').primary();
      table.uuid('uuid').notNullable().unique();
      table.integer('userid').unsigned();
      table.string('token', 500);
      table.datetime('expirydate');
      table.boolean('isused').defaultTo(false);
      table.datetime('addeddate');
      table.datetime('useddate');
      
      // Indexes
      table.index('token', 'idx_forgot_token');
      table.index(['userid', 'isused', 'expirydate']);
      
      // Foreign Key
      table.foreign('userid').references('userid').inTable('tbluser').onDelete('CASCADE');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tblforgotpassword')
    .dropTableIfExists('tbluser')
    .dropTableIfExists('tblcity')
    .dropTableIfExists('tblstates')
    .dropTableIfExists('tblcountries');
};
